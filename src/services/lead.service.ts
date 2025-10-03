import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateLeadDto } from '../dtos/lead-dto/create-lead.dto';
import { UpdateLeadDto } from '../dtos/lead-dto/update-lead.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { Lead } from 'src/database/entities/core-app-entities/lead.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { LeadQueryDto } from 'src/dtos/lead-dto/lead-query.dto';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Contact } from 'src/database/entities/core-app-entities/contact.entity';
import { Account } from 'src/database/entities/core-app-entities/account.entity';
import { LeadPreview } from 'src/dtos/lead-dto/lead-preview.dto';
import { ILike } from 'typeorm';
import { LeadToContactDto } from 'src/dtos/lead-dto/lead-to-contact.dto';
import { Role } from 'src/enums/core-app.enum';
import { LeadStatus } from 'src/enums/status.enum';
import { Readable } from 'stream';
import * as csv from 'csv-parser';
import { CountryService } from './country.service';

interface SerializedBuffer {
  type: 'Buffer';
  data: number[];
}

@Injectable()
export class LeadService {
  constructor(
    @InjectQueue('file-import') private readonly fileQueue: Queue,
    private readonly countryService: CountryService,
  ) {}

  async createLead(createLeadDto: CreateLeadDto, tenantId: string, user: User) {
    const leadRepo = await getRepo(Lead, tenantId);
    const leadExist = await leadRepo.findOne({
      where: [{ email: createLeadDto.email }, { phone: createLeadDto.phone }],
    });

    if (leadExist) {
      throw new BadRequestException({
        message: 'The lead is already present',
      });
    } else {
      const newLead: Lead = leadRepo.create({
        ...createLeadDto,
        createdBy: user,
      });

      await leadRepo.save(newLead);
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Lead inserted successfully',
      };
    }
  }

  async importLeads(file: Express.Multer.File, tenant: string, user: User) {
    const leadData = { file, tenant, user };
    await this.fileQueue.add('file-import', leadData);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Lead data imported successfully',
    };
  }

  async leadPreview(tenantId: string, id: string): Promise<APIResponse<LeadPreview>> {
    const leadRepo = await getRepo<Lead>(Lead, tenantId);
    const lead = await leadRepo.findOne({ where: { id } });
    const contactRepo = await getRepo<Contact>(Contact, tenantId);
    const accountRepo = await getRepo<Account>(Account, tenantId);
    if (!lead) {
      throw new NotFoundException({ message: 'Lead not found or invalid lead id' });
    } else {
      const account = await accountRepo.findOne({ where: { name: ILike(`%${lead.company}%`) } });
      const contact = await contactRepo.findOne({
        where: [{ email: lead.email }, { phone: lead.phone }],
      });
      const leadPreview: LeadPreview = {
        createAccount: account ? false : true,
        createContact: contact ? false : true,
        accountName: account ? undefined : lead.company,
        contactName: contact ? undefined : lead.name,
      };
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Lead preview fetched successfully',
        data: leadPreview,
      };
    }
  }

  async convertLead(
    tenantId: string,
    id: string,
    user: User,
    leadToContact?: LeadToContactDto,
  ): Promise<APIResponse<unknown>> {
    const leadRepo = await getRepo<Lead>(Lead, tenantId);
    const lead = await leadRepo.findOne({ where: { id }, relations: { assignedTo: true } });
    const contactRepo = await getRepo<Contact>(Contact, tenantId);
    const accountRepo = await getRepo<Account>(Account, tenantId);

    if (!lead) {
      throw new BadRequestException({ message: 'Invalid lead id or lead not found' });
    }
    if (!lead.assignedTo && user.role == Role.SalesRep) {
      throw new UnauthorizedException({
        message: 'Not authorized to convert others lead to contact',
      });
    } else if (lead.assignedTo && lead.assignedTo.id != user.id && user.role == Role.SalesRep) {
      throw new UnauthorizedException({
        message: 'Not authorized to convert others lead to contact',
      });
    }
    if (lead.status === LeadStatus.Disqualified) {
      throw new BadRequestException({
        message: 'Cannot convert disqualified lead first update status',
      });
    }

    const isContact = await contactRepo.findOne({
      where: [{ email: lead.email }, { phone: lead.phone }],
    });
    if (isContact) {
      throw new BadRequestException({ message: 'This lead is already converted into contact' });
    }
    const isAccount = await accountRepo.findOne({ where: { name: ILike(`%${lead.company}%`) } });
    let newAccount = leadToContact?.account
      ? await accountRepo.findOne({
          where: { name: leadToContact?.account?.name },
        })
      : null;

    if (!isAccount && leadToContact && leadToContact.account) {
      const { country, ...accountData } = leadToContact.account;
      let accountCountry: string | undefined;
      if (country) {
        accountCountry = this.countryService.getCountry(country);
      }

      if (!newAccount) {
        newAccount = await accountRepo.save({
          ...accountData,
          createdBy: user,
          country: accountCountry,
        });
      }
    }
    const newContact = await contactRepo.save({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      createdBy: user,
      accountId: isAccount ? isAccount : newAccount ? newAccount : undefined,
    });
    lead.contact = newContact;
    lead.status = LeadStatus.Converted;
    lead.convertedBy = user;
    await leadRepo.save(lead);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lead is successfully converted into contact',
    };
  }

  async findAllLeads(leadQuery: LeadQueryDto, tenant: string): Promise<APIResponse<Lead[]>> {
    const leadRepo = await getRepo(Lead, tenant);
    const qb = leadRepo.createQueryBuilder('lead');

    const page = Math.max(1, Number(leadQuery.page ?? 1));
    const defaultLimit = Number(leadQuery.limit ?? 10);
    const limit =
      Number.isFinite(defaultLimit) && defaultLimit > 0
        ? Math.min(100, Math.floor(defaultLimit))
        : 10;
    const skip = (page - 1) * limit;

    for (const [key, value] of Object.entries(leadQuery)) {
      if (value == null || key === 'page' || key === 'limit') continue;

      if (key === 'source') {
        qb.andWhere(`lead.${key} = :${key}`, { [key]: value });
      } else if (['name', 'email', 'phone', 'company'].includes(key)) {
        qb.andWhere(`lead.${key} ILIKE :${key}`, { [key]: `%${value}%` });
      } else {
        qb.andWhere(`lead.${key} = :${key}`, { [key]: value });
      }
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lead details fetched based on filter',
      data,
      pageInfo: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateLead(id: string, user: User, updateLeadDto: UpdateLeadDto, tenant: string) {
    const leadRepo = await getRepo(Lead, tenant);
    const userRepo = await getRepo(User, tenant);
    let assignedUser: User | null = null;
    if (updateLeadDto.assignedTo && user.role == Role.SalesRep) {
      throw new UnauthorizedException({
        message: 'Not have enough authorization to assign a lead',
      });
    } else {
      assignedUser = await userRepo.findOne({ where: { id: updateLeadDto.assignedTo } });
      if (!assignedUser) {
        throw new BadRequestException({ message: 'Lead is not assigned to invalid id' });
      }
    }

    const lead = await leadRepo.findOne({ where: { id } });
    if (!lead) {
      throw new BadRequestException({
        message: 'Lead not found or invalid lead id',
      });
    } else {
      if (lead.status == LeadStatus.Converted) {
        throw new BadRequestException({ message: 'Lead is already converted cannot update' });
      }

      const { assignedTo, ...other } = updateLeadDto;
      leadRepo.merge(lead, other);
      lead.assignedTo = assignedUser ? assignedUser : undefined;
      await leadRepo.save(lead);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Lead updated successfully',
      };
    }
  }

  async bulkLeadsSave(file: Express.Multer.File, tenant: string, user: User) {
    const results: Partial<Lead>[] = [];
    const leadRepo = await getRepo(Lead, tenant);
    const leads = await leadRepo.find({ select: { email: true, phone: true } });

    await new Promise((resolve, reject) => {
      const serializedBuffer = file.buffer as unknown as SerializedBuffer;

      const buffer = Buffer.from(serializedBuffer.data);
      const stream = new Readable();

      stream.push(buffer);
      stream.push(null);

      stream
        .pipe(csv())
        .on('data', (row: CreateLeadDto) => {
          results.push({
            name: row['name'],
            email: row['email'],
            phone: row['phone'],
            company: row['company'] || undefined,
            source: row['source'] || undefined,
            createdBy: user,
          });
        })
        .on('end', async () => {
          const finalLead = results.filter(
            (result) =>
              !leads.some((lead) => lead.email === result.email || lead.phone === result.phone),
          );
          if (finalLead.length > 0) {
            const newLeads = leadRepo.create(finalLead);
            await leadRepo.save(newLeads);
          }
          resolve(results as Lead[]);
        })
        .on('error', (err: unknown) => reject(err));
    });
  }
}
