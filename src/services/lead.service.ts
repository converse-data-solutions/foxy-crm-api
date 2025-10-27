import { BadRequestException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateLeadDto } from '../dtos/lead-dto/create-lead.dto';
import { UpdateLeadDto } from '../dtos/lead-dto/update-lead.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { Lead } from 'src/database/entities/core-app-entities/lead.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { Queue } from 'bullmq';
import csv from 'csv-parser';
import { InjectQueue } from '@nestjs/bullmq';
import { LeadQueryDto } from 'src/dtos/lead-dto/get-lead.dto';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Role } from 'src/enums/core-app.enum';
import { LeadStatus } from 'src/enums/status.enum';
import { Readable } from 'stream';
import { paginationParams } from 'src/shared/utils/pagination-params.util';
import { Note } from 'src/database/entities/core-app-entities/note.entity';
import { NotesEntityName } from 'src/enums/lead-activity.enum';
import { MetricService } from './metric.service';
import { MetricDto } from 'src/dtos/metric-dto/metric.dto';
import { bulkLeadFailureTemplate } from 'src/templates/bulk-failure.template';
import { EmailService } from './email.service';
import { applyFilters, FiltersMap, FilterType } from 'src/shared/utils/query-filter.util';

interface SerializedBuffer {
  type: 'Buffer';
  data: number[];
}

@Injectable()
export class LeadService {
  constructor(
    @InjectQueue('file-import') private readonly fileQueue: Queue,
    private readonly metricService: MetricService,
    private readonly emailService: EmailService,
  ) {}

  async createLead(createLeadDto: CreateLeadDto, tenantId: string, user: User) {
    const leadRepo = await getRepo(Lead, tenantId);
    const userRepo = await getRepo(User, tenantId);
    const leadExist = await leadRepo.findOne({
      where: [{ email: createLeadDto.email }, { phone: createLeadDto.phone }],
    });
    const { assignedTo, ...createLead } = createLeadDto;
    let existingUser: User | null = null;
    if (assignedTo) {
      if (![Role.Admin, Role.Manager].includes(user.role)) {
        throw new UnauthorizedException('Admin or manger only can assign a lead to the user');
      }
      existingUser = await userRepo.findOne({ where: { id: assignedTo } });
      if (!existingUser) {
        throw new BadRequestException('Invalid user id for lead assignment');
      }
    }
    if (leadExist) {
      throw new BadRequestException('The lead is already present');
    } else {
      const newLead: Lead = leadRepo.create({
        ...createLead,
        createdBy: user,
        assignedTo: existingUser ?? undefined,
      });

      await leadRepo.save(newLead);
      const metric: Partial<MetricDto> = { leads: 1 };
      await this.metricService.updateTenantCounts(tenantId, metric);
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Lead inserted successfully',
      };
    }
  }

  async importLeads(file: Express.Multer.File, tenant: string, user: User) {
    const leadData = { file, tenant, user };
    this.fileQueue.add('file-import', leadData);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Bulk lead upload received. Processing in background.',
    };
  }

  async findAllLeads(
    leadQuery: LeadQueryDto,
    tenant: string,
    user: User,
  ): Promise<APIResponse<Lead[]>> {
    const leadRepo = await getRepo(Lead, tenant);
    const noteRepo = await getRepo(Note, tenant);
    const qb = leadRepo
      .createQueryBuilder('lead')
      .leftJoin('lead.assignedTo', 'user')
      .leftJoinAndSelect('lead.leadActivities', 'leadActivities');

    const { limit, page, skip } = paginationParams(leadQuery.page, leadQuery.limit);
    const FILTERS: FiltersMap = {
      source: { column: 'lead.source', type: 'exact' },
      email: { column: 'lead.email', type: 'exact' },
      phone: { column: 'lead.phone', type: 'exact' },
      name: { column: 'lead.name', type: 'ilike' },
      company: { column: 'lead.company', type: 'ilike' },
      status: { column: 'lead.status', type: 'exact' },
      id: { column: 'lead.id', type: 'exact' },
      assignedTo: { column: 'lead.assignedTo', type: 'exact' },
    };
    applyFilters(qb, FILTERS, leadQuery);

    if (![Role.Admin, Role.Manager].includes(user.role)) {
      qb.andWhere(`user.id =:id`, { id: user.id });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    const pageInfo = { total, limit, page, totalPages: Math.ceil(total / limit) };
    const leadData: Lead[] = [];
    for (const lead of data) {
      const notes = await noteRepo.find({
        where: { entityId: lead.id, entityName: NotesEntityName.Lead },
      });
      lead['notes'] = notes;
      leadData.push(lead);
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lead details fetched based on filter',
      data: leadData,
      pageInfo,
    };
  }

  async updateLead(id: string, user: User, updateLeadDto: UpdateLeadDto, tenant: string) {
    const leadRepo = await getRepo(Lead, tenant);
    const userRepo = await getRepo(User, tenant);
    let assignedUser: User | null = null;
    if (updateLeadDto.assignedTo) {
      if (user.role === Role.SalesRep) {
        throw new UnauthorizedException('Not have enough authorization to assign a lead');
      }
      assignedUser = await userRepo.findOne({ where: { id: updateLeadDto.assignedTo } });
      if (!assignedUser) {
        throw new BadRequestException('Lead is not assigned to invalid id');
      }
    }

    const lead = await leadRepo.findOne({ where: { id } });
    if (!lead) {
      throw new BadRequestException('Lead not found or invalid lead id');
    } else {
      if (lead.status == LeadStatus.Converted) {
        throw new BadRequestException('Lead is already converted cannot update');
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
    const existingLeads = await leadRepo.find({ select: { email: true, phone: true } });

    const buffer = Buffer.from((file.buffer as unknown as SerializedBuffer).data);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    try {
      await new Promise<void>((resolve, reject) => {
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
            try {
              const newLeads = results.filter(
                (r) => !existingLeads.some((l) => l.email === r.email || l.phone === r.phone),
              );

              if (newLeads.length > 0) {
                const created = leadRepo.create(newLeads);
                const inserted = await leadRepo.insert(created);
                await this.metricService.updateTenantCounts(tenant, {
                  leads: inserted.identifiers.length,
                });
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          })
          .on('error', (err) => reject(err));
      });
    } catch (err: any) {
      const html = bulkLeadFailureTemplate(user.name, file.originalname, err.message);
      await this.emailService.sendMail({
        to: user.email,
        html,
        subject: 'Bulk Lead Upload Failed - Action Required',
      });
    }
  }
}
