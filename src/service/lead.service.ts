import {
  BadRequestException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { Lead } from 'src/database/entity/core-app/lead.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { JwtPayload } from 'src/dto/jwt-payload.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { LeadQueryDto } from 'src/dto/lead-query.dto';
import { APIResponse } from 'src/dto/response.dto';

@Injectable()
export class LeadService {
  constructor(@InjectQueue('file-import') private readonly fileQueue: Queue) {}

  async create(
    createLeadDto: CreateLeadDto,
    tenantId: string,
    user: JwtPayload,
  ) {
    const leadRepo = await getRepo(Lead, tenantId);
    const userRepo = await getRepo(User, tenantId);
    const leadExist = await leadRepo.findOne({
      where: [{ email: createLeadDto.email }, { phone: createLeadDto.phone }],
    });

    if (leadExist) {
      throw new BadRequestException({
        message: 'The lead is already present',
      });
    } else {
      const createdBy = await userRepo.findOne({ where: { id: user.id } });
      const newLead: Lead = leadRepo.create({
        ...createLeadDto,
        createdBy: createdBy ? createdBy : undefined,
      });

      await leadRepo.save(newLead);
      return {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Lead inserted successfully',
      };
    }
  }

  async importLeads(
    file: Express.Multer.File,
    tenant: string,
    user: JwtPayload,
  ) {
    const leadData = { file, tenant, user };
    await this.fileQueue.add('file-import', leadData);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Lead data imported successfully',
    };
  }

  async findAll(
    leadQuery: LeadQueryDto,
    tenant: string,
    user: JwtPayload,
  ): Promise<APIResponse<Lead[]>> {
    const leadRepo = await getRepo(Lead, tenant);
    const qb = leadRepo.createQueryBuilder('lead');
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

    const page = leadQuery.page ?? 1;
    const limit = leadQuery.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lead data fetched based on filter',
      data,
      pageInfo: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} lead`;
  }

  async update(
    id: string,
    updateLeadDto: UpdateLeadDto,
    tenant: string,
    user: JwtPayload,
  ) {
    const leadRepo = await getRepo(Lead, tenant);
    const userRepo = await getRepo(User, tenant);
    let assignedUser: User | null = null;
    if (updateLeadDto.assignedTo) {
      assignedUser = await userRepo.findOne({
        where: { id: updateLeadDto.assignedTo },
      });
      if (!assignedUser) {
        throw new BadRequestException({
          message: 'Lead is not assigned to invalid user id',
        });
      }
    }
    const lead = await leadRepo.findOne({ where: { id } });
    if (!lead) {
      throw new BadRequestException({
        message: 'Lead not found or invalid lead id',
      });
    } else {
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

  remove(id: number) {
    return `This action removes a #${id} lead`;
  }
}
