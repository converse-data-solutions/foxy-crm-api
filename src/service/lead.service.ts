import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { Lead } from 'src/database/entity/core-app/lead.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { JwtPayload } from 'src/dto/jwt-payload.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

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
      message: 'Lead data imported successfully'
    }
  }
  findAll() {
    return `This action returns all lead`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lead`;
  }

  update(id: number, updateLeadDto: UpdateLeadDto) {
    return `This action updates a #${id} lead`;
  }

  remove(id: number) {
    return `This action removes a #${id} lead`;
  }
}
