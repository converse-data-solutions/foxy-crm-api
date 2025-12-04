import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import * as fs from 'fs';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { BillingCycle } from '../enums/billing-cycle.enum';
import { PlanPricing } from 'src/database/entities/base-app-entities/plan-pricing.entity';
import { Plan } from 'src/database/entities/base-app-entities/plan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { join } from 'path';
import { PlanInterface } from 'src/interfaces/plan.interface';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { EntityName, LeadSource, Role, TaskPriority, TaskType } from 'src/enums/core-app.enum';
import {
  DealStage,
  LeadStatus,
  StatusCause,
  TaskStatus,
  TicketStatus,
} from 'src/enums/status.enum';
import * as bcrypt from 'bcrypt';
import { Tenant } from 'src/database/entities/base-app-entities/tenant.entity';
import { getConnection } from 'src/shared/database-connection/get-connection';
import { SALT_ROUNDS } from 'src/shared/utils/config.util';
import { CountryService } from './country.service';
import { Lead } from 'src/database/entities/core-app-entities/lead.entity';
import { LeadActivityType, NotesEntityName } from 'src/enums/lead-activity.enum';
import { LeadActivity } from 'src/database/entities/core-app-entities/lead-activity.entity';
import { Note } from 'src/database/entities/core-app-entities/note.entity';
import { Contact } from 'src/database/entities/core-app-entities/contact.entity';
import { Account } from 'src/database/entities/core-app-entities/account.entity';
import { Deal } from 'src/database/entities/core-app-entities/deal.entity';
import { Task } from 'src/database/entities/core-app-entities/task.entity';
import { Ticket } from 'src/database/entities/core-app-entities/ticket.entity';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  private planDefinitions: PlanInterface[] = [];

  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectRepository(PlanPricing) private readonly pricingRepo: Repository<PlanPricing>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    private readonly countryService: CountryService,
    private readonly rootDataSource: DataSource,
  ) {}

  async subscriptionSeed() {
    const filePath = join(__dirname, '../seed/subscription-mock-data.json');

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    this.planDefinitions = JSON.parse(rawData);

    for (const planDef of this.planDefinitions) {
      const stripeProducts = await this.stripe.products.list({ limit: 100 });
      let stripeProduct = stripeProducts.data.find((p) => p.metadata?.planName === planDef.name);

      if (!stripeProduct) {
        stripeProduct = await this.stripe.products.create({
          name: planDef.name,
          description: `${planDef.name} Plan`,
          metadata: { planName: planDef.name },
        });
      }
      let plan = await this.planRepo.findOne({ where: { planName: planDef.name } });
      if (!plan) {
        plan = this.planRepo.create({
          planName: planDef.name,
          stripeProductId: stripeProduct.id,
          userCount: planDef.userCount,
        });
        await this.planRepo.save(plan);
      } else {
        if (!plan.stripeProductId || plan.stripeProductId !== stripeProduct.id) {
          plan.stripeProductId = stripeProduct.id;
          await this.planRepo.save(plan);
        }
      }
      const existingPrices = await this.stripe.prices.list({
        product: stripeProduct.id,
        active: true,
      });

      for (const [cycle, amount] of Object.entries(planDef.prices)) {
        let interval: 'month' | 'year' = 'month';
        let interval_count = 1;

        switch (cycle.toLowerCase()) {
          case 'monthly':
            interval = 'month';
            interval_count = 1;
            break;
          case 'quarterly':
            interval = 'month';
            interval_count = 3;
            break;
          case 'halfyearly':
            interval = 'month';
            interval_count = 6;
            break;
          case 'yearly':
            interval = 'year';
            interval_count = 1;
            break;
        }

        let stripePrice = existingPrices.data.find(
          (p) =>
            p.recurring?.interval === interval &&
            p.recurring?.interval_count === interval_count &&
            p.metadata?.billingCycle === cycle,
        );

        if (!stripePrice) {
          stripePrice = await this.stripe.prices.create({
            unit_amount: amount * 100,
            currency: 'inr',
            recurring: { interval, interval_count },
            product: stripeProduct.id,
            metadata: { billingCycle: cycle },
          });
        }

        let planPricing = await this.pricingRepo.findOne({
          where: { plan: { id: plan.id }, billingCycle: cycle as BillingCycle },
        });

        if (!planPricing) {
          planPricing = this.pricingRepo.create({
            plan,
            billingCycle: cycle as BillingCycle,
            price: amount,
            stripePriceId: stripePrice.id,
          });
          await this.pricingRepo.save(planPricing);
        } else {
          if (!planPricing.stripePriceId || planPricing.stripePriceId !== stripePrice.id) {
            planPricing.stripePriceId = stripePrice.id;
            await this.pricingRepo.save(planPricing);
          }
        }
      }
    }

    this.logger.log('Subscription plans seeded successfully!');
  }

  async runTenantSeed() {
    const tenant: Tenant = {
      organizationName: 'Tenant One',
      userName: 'SuperAdmin',
      password: 'Admin@123',
      email: 'admin@tenant1.com',
      phone: '1234567890',
      domain: 'tenant1.com',
      schemaName: '4989940e-edc5-4cdf-8d9b-0b984257f082',

      country: 'United States',
      city: 'NY',
      address: '123 Main St',

      emailVerified: true,
    } as Tenant;

    const token = 'sample-refresh-token';

    await this.tenantSetup({ tenant, token });
  }

  async tenantSetup(tenantData: { tenant: Tenant; token?: string }) {
    const check = await this.tenantRepo.find();

    if (check.length > 0) {
      return;
    }
    const { tenant, token } = tenantData;
    const schema = tenant.schemaName;

    const queryRunner = this.rootDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await queryRunner.commitTransaction();
      const tenantDataSource = await getConnection(schema);
      await tenantDataSource.runMigrations();

      const isTenant = await this.tenantRepo.findOne({
        where: [
          { organizationName: tenant.organizationName },
          { email: tenant.email },
          { domain: tenant.domain },
        ],
      });
      if (isTenant) {
        if (isTenant.emailVerified) {
          throw new ConflictException(
            'An organization or email with this domain is already registered.',
          );
        }
        return {
          success: true,
          statusCode: HttpStatus.OK,
          message: 'Please verify your email to continue.',
        };
      } else {
        const hashPassword = await bcrypt.hash(tenant.password, SALT_ROUNDS);
        const { country, ...tenantData } = tenant;
        let tenantCountry: string | undefined;
        if (country) {
          tenantCountry = this.countryService.getCountry(country);
        }
        await this.tenantRepo.save({
          ...tenantData,
          domain: tenant.domain,
          country: tenantCountry,
          password: hashPassword,
        });
        const hashedPassword = await bcrypt.hash(tenant.password, SALT_ROUNDS);
        const userRepo = tenantDataSource.getRepository(User);
        const user = userRepo.create({
          name: tenant.userName,
          password: hashedPassword,
          phone: tenant.phone,
          country: tenant.country,
          address: tenant.address,
          emailVerified: true,
          city: tenant.city,
          role: Role.SuperAdmin,
          email: tenant.email,
          refreshToken: token,
        });

        await userRepo.save(user);
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();

      await queryRunner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);

      throw new InternalServerErrorException('Tenant setup failed. Please try again later.');
    } finally {
      await queryRunner.release();
    }
  }

  async defaultsubscriptionSeed() {
    const check = await this.subscriptionRepo.find();

    if (check.length > 0) {
      return;
    }
    const tenant = await this.tenantRepo.findOne({
      where: { email: 'admin@tenant1.com' },
    });

    if (!tenant) {
      console.warn('Tenant not found. Run tenant seed first!');
      return;
    }

    const plan = await this.pricingRepo.find();

    if (!plan) {
      console.warn('PlanPricing not found. Seed plan first!');
      return;
    }

    const subscription = this.subscriptionRepo.create({
      status: true,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      stripeSessionId: 'sess_sample_123',
      stripeSubscriptionId: 'sub_sample_123',
      stripeCustomerId: 'cus_sample_123',
      tenant: tenant,
      planPrice: plan[0],
    });

    await this.subscriptionRepo.save(subscription);

    console.log('✅ Subscription seeded successfully!');
  }

  async getTenant(email: string): Promise<DataSource> {
    const publicDataSource = await getConnection('public');

    const queryRunner = publicDataSource.createQueryRunner();

    try {
      const schemas: { schema_name: string }[] = await queryRunner.query(
        `SELECT schema_name FROM information_schema.schemata`,
      );

      const tenant = await this.tenantRepo.findOne({
        where: { email },
        relations: { subscription: true },
      });

      if (!tenant) {
        throw new BadRequestException('Please use your work email address.');
      }

      if (!tenant.emailVerified) {
        throw new BadRequestException('Please verify your email first.');
      }

      const schemaExist = schemas.find((s) => s.schema_name === tenant.schemaName);
      console.log('schemaExist', schemaExist);
      if (!schemaExist) {
        await this.tenantSetup({ tenant });

        throw new BadRequestException(
          'Tenant setup is in progress. Please login after setup completion.',
        );
      }

      const tenantDataSource = await getConnection(tenant.schemaName);
      return tenantDataSource;
    } finally {
      await queryRunner.release();
    }
  }

  async userSeed(tenantDataSource: DataSource) {
    const userRepo = tenantDataSource.getRepository(User);

    const filePath = join(__dirname, '../seed/user-mock-data.json');

    if (!fs.existsSync(filePath)) {
      this.logger.warn(`User seed file not found at: ${filePath}`);
      return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const usersData: any[] = JSON.parse(rawData);

    for (const userData of usersData) {
      const existingUser = await userRepo.findOne({
        where: [{ email: userData.email }, { phone: userData.phone }],
      });

      if (existingUser) {
        this.logger.log(`User already exists: ${userData.email}`);
        continue;
      }

      let plainPassword = userData.role === 'Admin' ? 'admin@123' : 'salerep@123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const user = userRepo.create({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        role: userData.role as Role,
        address: userData.address ?? null,
        city: userData.city ?? null,
        country: userData.country ?? null,
        status: userData.status ?? true,
        statusCause: userData.statusCause ? (userData.statusCause as StatusCause) : null,
        emailVerified: userData.emailVerified ?? false,
        otpVerified: userData.otpVerified ?? false,
      });

      await userRepo.save(user);
      this.logger.log(`Seeded user: ${user.email} (${user.role})`);
    }

    this.logger.log('User seeding completed successfully!');
  }

  async leadSeed(tenantDataSource: DataSource) {
    const leadRepo = tenantDataSource.getRepository(Lead);
    const userRepo = tenantDataSource.getRepository(User);

    const filePath = join(__dirname, '../seed/lead-mock-data.json');

    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Lead seed file not found at: ${filePath}`);
      return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const leadsData: any[] = JSON.parse(rawData);

    const salesReps = await userRepo.find({
      where: { role: Role.SalesRep },
    });

    for (const leadData of leadsData) {
      const existingLead = await leadRepo.findOne({
        where: [{ email: leadData.email }, { phone: leadData.phone }],
      });

      if (existingLead) {
        this.logger.log(`Lead already exists: ${leadData.email}`);
        continue;
      }

      const assignedRep =
        salesReps.length > 0 ? salesReps[Math.floor(Math.random() * salesReps.length)] : null;

      const lead = leadRepo.create({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        company: leadData.company,
        source: leadData.source,
        status: leadData.status,
        assignedTo: assignedRep ?? null,
        createdBy: assignedRep ?? null,
      } as DeepPartial<Lead>);

      await leadRepo.save(lead);
      this.logger.log(`✅ Lead seeded: ${lead.email}`);
    }

    this.logger.log('✅ Lead seeding completed successfully!');
  }

  async leadActivityAndNoteSeed(tenantDataSource: DataSource) {
    const leadRepo = tenantDataSource.getRepository(Lead);
    const leadActivityRepo = tenantDataSource.getRepository(LeadActivity);
    const noteRepo = tenantDataSource.getRepository(Note);
    const userRepo = tenantDataSource.getRepository(User);

    const noteFilePath = join(__dirname, '../seed/note-mock-data.json');
    const activityFilePath = join(__dirname, '../seed/lead-activity-mock-data.json');

    if (!fs.existsSync(noteFilePath)) {
      this.logger.warn(`Note seed file not found at: ${noteFilePath}`);
      return;
    }
    if (!fs.existsSync(activityFilePath)) {
      this.logger.warn(`Lead Activity seed file not found at: ${activityFilePath}`);
      return;
    }

    const rawNotesData = fs.readFileSync(noteFilePath, 'utf-8');
    const notesData: any[] = JSON.parse(rawNotesData);

    const rawActivitiesData = fs.readFileSync(activityFilePath, 'utf-8');
    const activitiesData: any[] = JSON.parse(rawActivitiesData);

    const leads = await leadRepo.find();
    if (leads.length === 0) {
      this.logger.warn('⚠️ No leads found. Run leadSeed() first.');
      return;
    }

    const users = await userRepo.find();
    if (users.length === 0) {
      this.logger.warn('⚠️ No users found. Run userSeed() first.');
      return;
    }

    for (const lead of leads) {
      const savedNotes: Note[] = [];
      for (const noteData of notesData) {
        const note = noteRepo.create({
          content: noteData.content,
          entityName: NotesEntityName.Lead,
          entityId: lead.id,
          createdBy: users[Math.floor(Math.random() * users.length)],
        });
        const savedNote = await noteRepo.save(note);
        savedNotes.push(savedNote);
        this.logger.log(`✅ Note added for Lead: ${lead.email}`);
      }

      const activityCount = Math.floor(Math.random() * 3) + 3;
      const shuffledActivities = activitiesData
        .map((a) => ({ ...a }))
        .sort(() => Math.random() - 0.5)
        .slice(0, activityCount);

      for (const activityData of shuffledActivities) {
        if (savedNotes.length === 0) continue;

        const randomNote = savedNotes[Math.floor(Math.random() * savedNotes.length)];
        const randomUser = users[Math.floor(Math.random() * users.length)];

        const leadActivity = leadActivityRepo.create({
          leadId: lead,
          activityType: activityData.activityType as LeadActivityType,
          noteId: randomNote.id,
          createdBy: randomUser,
          activityDate: new Date(),
        });

        await leadActivityRepo.save(leadActivity);
        this.logger.log(
          `✅ Activity ${leadActivity.activityType} added for Lead: ${lead.email} by User: ${randomUser.name}`,
        );
      }
    }

    this.logger.log('✅ Lead Activity and Note seeding completed successfully!');
  }

  async accountSeed(dataSource: DataSource) {
    const accountRepo = dataSource.getRepository(Account);
    const check = await accountRepo.find();

    if (check.length > 0) {
      return;
    }
    const filePath = join(__dirname, '../seed/accounts-mock-data.json');

    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Note seed file not found at: ${filePath}`);
      return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const accountsData: any[] = JSON.parse(rawData);

    for (const accountData of accountsData) {
      const account = accountRepo.create(accountData);
      try {
        await accountRepo.save(account);
      } catch (error) {
        console.error(`Failed to seed account ${accountData.name}:`, error);
      }
    }

    console.log('All 20 accounts seeded successfully!');
  }

  async contactSeed(dataSource: DataSource) {
    const contactRepo = dataSource.getRepository(Contact);
    const accountRepo = dataSource.getRepository(Account);
    const userRepo = dataSource.getRepository(User);
    const leadRepo = dataSource.getRepository(Lead);
    const check = await contactRepo.find();

    if (check.length > 0) {
      return;
    }
    const accounts = await accountRepo.find();
    const users = await userRepo.find();
    const leads = await leadRepo.find();

    if (!accounts.length || !users.length || !leads.length) {
      console.warn('Accounts, users, or leads not found. Seed them first!');
      return;
    }

    const filePath = join(__dirname, '../seed/contacts-mock-data.json');
    if (!fs.existsSync(filePath)) {
      console.warn(`Contact seed file not found at: ${filePath}`);
      return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const contactsSeed: any[] = JSON.parse(rawData);

    for (const contactData of contactsSeed) {
      const account = accounts[Math.floor(Math.random() * accounts.length)];
      const assignedUser = users[Math.floor(Math.random() * users.length)];
      const lead = leads[Math.floor(Math.random() * leads.length)];

      const contact = contactRepo.create({
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        accountId: account,
        assignedTo: assignedUser,
        lead: lead,
      });

      contact.lead.status = contactData.status as LeadStatus;

      try {
        await contactRepo.save(contact);
      } catch (error) {
        console.error(`Failed to seed contact ${contactData.name}:`, error);
      }
    }

    console.log('All contacts seeded successfully!');
  }

  async dealSeed(dataSource: DataSource) {
    const dealRepo = dataSource.getRepository(Deal);
    const contactRepo = dataSource.getRepository(Contact);
    const userRepo = dataSource.getRepository(User);
    const check = await dealRepo.find();

    if (check.length > 0) {
      return;
    }
    const contacts = await contactRepo.find();
    const users = await userRepo.find();

    if (!contacts.length || !users.length) {
      console.warn('Contacts or Users not found. Seed them first!');
      return;
    }

    const filePath = join(__dirname, '../seed/deal-mock-data.json');
    if (!fs.existsSync(filePath)) {
      console.warn(`Contact seed file not found at: ${filePath}`);
      return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const dealNames: any[] = JSON.parse(rawData);

    for (const dealname of dealNames) {
      const contact = contacts[Math.floor(Math.random() * contacts.length)];
      const createdBy = users[Math.floor(Math.random() * users.length)];
      const stages = Object.values(DealStage);

      const deal = dealRepo.create({
        name: dealname.name,
        value: Math.floor(Math.random() * 50000) + 1000,
        stage: stages[Math.floor(Math.random() * stages.length)],
        expectedCloseDate: new Date(
          Date.now() + Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000,
        ),
        notes: dealname.notes,
        contactId: contact,
        createdBy,
      });

      await dealRepo.save(deal);
    }

    console.log('All deals seeded successfully!');
  }

  async ticketSeed(dataSource: DataSource) {
    const ticketRepo = dataSource.getRepository(Ticket);
    const contactRepo = dataSource.getRepository(Contact);
    const dealRepo = dataSource.getRepository(Deal);
    const userRepo = dataSource.getRepository(User);

    const check = await ticketRepo.find();

    if (check.length > 0) {
      return;
    }
    const contacts = await contactRepo.find();
    const users = await userRepo.find();

    const completedDeals = await dealRepo.find({
      where: { stage: DealStage.Completed },
    });

    if (!contacts.length || !completedDeals.length || !users.length) {
      console.log('❌ Skipping Ticket Seed: Missing Contacts, Users, or Completed Deals');
      return;
    }

    const filePath = join(__dirname, '../seed/tickets-mock-data.json');

    if (!fs.existsSync(filePath)) {
      console.warn(`Ticket seed file not found at: ${filePath}`);
      return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const ticketSeedData: any[] = JSON.parse(rawData);

    for (const seed of ticketSeedData) {
      const contact = contacts[Math.floor(Math.random() * contacts.length)];
      const deal = completedDeals[Math.floor(Math.random() * completedDeals.length)];
      const createdBy = users[Math.floor(Math.random() * users.length)];
      const updatedBy = users[Math.floor(Math.random() * users.length)];

      const ticket = ticketRepo.create({
        title: seed.title,
        description: seed.description,
        status: TicketStatus.Open,
        contactId: contact,
        dealId: deal,
        createdBy,
        updatedBy,
        resolvedAt: new Date(),
      });

      await ticketRepo.save(ticket);
    }

    console.log('✅ Tickets seeded from JSON for COMPLETED deals!');
  }

  async taskSeed(dataSource: DataSource) {
    const taskRepo = dataSource.getRepository(Task);
    const userRepo = dataSource.getRepository(User);
    const dealRepo = dataSource.getRepository(Deal);
    const ticketRepo = dataSource.getRepository(Ticket);

    // Prevent reseeding
    const check = await taskRepo.find();
    if (check.length > 0) return;

    const users = await userRepo.find();
    if (!users.length) {
      console.log('❌ No users found. Skipping Task seeding.');
      return;
    }

    const deals = await dealRepo.find({ where: { stage: DealStage.Accepted } });
    const tickets = await ticketRepo.find();

    if (!deals.length && !tickets.length) {
      console.log('❌ No deals or tickets found. Skipping Task seeding.');
      return;
    }

    const filePath = join(__dirname, '../seed/accounts-mock-data.json');
    if (!fs.existsSync(filePath)) {
      console.warn(`Task seed file not found at: ${filePath}`);
      return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const taskNames: { name: string }[] = JSON.parse(rawData);

    // Alternate assignment: even index -> deal, odd index -> ticket
    for (let i = 0; i < taskNames.length; i++) {
      const taskname = taskNames[i];
      const assignedTo = users[Math.floor(Math.random() * users.length)];
      const createdBy = users[Math.floor(Math.random() * users.length)];

      // Determine entity type
      let entity: { name: EntityName; id: string };
      if (i % 2 === 0 && deals.length) {
        entity = { name: EntityName.Deal, id: deals[Math.floor(Math.random() * deals.length)].id };
      } else if (tickets.length) {
        entity = {
          name: EntityName.Ticket,
          id: tickets[Math.floor(Math.random() * tickets.length)].id,
        };
      } else {
        // fallback if one type is missing
        entity = {
          name: deals.length ? EntityName.Deal : EntityName.Ticket,
          id: deals.length ? deals[0].id : tickets[0].id,
        };
      }

      const task = taskRepo.create({
        name: taskname.name,
        entityName: entity.name,
        entityId: entity.id,
        type: Object.values(TaskType)[Math.floor(Math.random() * Object.values(TaskType).length)],
        status: TaskStatus.Pending,
        priority:
          Object.values(TaskPriority)[
            Math.floor(Math.random() * Object.values(TaskPriority).length)
          ],
        assignedTo: assignedTo.id,
        createdBy: createdBy.id,
      } as DeepPartial<Task>);

      await taskRepo.save(task);
      console.log(`✅ Task "${task.name}" assigned to ${entity.name} (${entity.id})`);
    }

    console.log('✅ All tasks seeded successfully for Deals and Tickets!');
  }
}
