import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { APIResponse } from 'src/common/dtos/response.dto';
import { LeadActivity } from 'src/database/entities/core-app-entities/lead-activity.entity';
import { Lead } from 'src/database/entities/core-app-entities/lead.entity';
import { Note } from 'src/database/entities/core-app-entities/note.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { CreateLeadActivityDto } from 'src/dtos/activity-dto/create-lead-activity.dto';
import { Role } from 'src/enums/core-app.enum';
import { NotesEntityName } from 'src/enums/lead-activity.enum';
import { LeadStatus } from 'src/enums/status.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';

@Injectable()
export class LeadActivityService {
  async createLeadActivity(
    tenantId: string,
    user: User,
    createLeadActivityDto: CreateLeadActivityDto,
  ): Promise<APIResponse> {
    const leadActivityRepo = await getRepo<LeadActivity>(LeadActivity, tenantId);
    const noteRepo = await getRepo(Note, tenantId);
    const leadRepo = await getRepo(Lead, tenantId);
    const lead = await leadRepo.findOne({
      where: { id: createLeadActivityDto.leadId },
      relations: { assignedTo: true },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found or invalid lead ID.');
    }
    if (user.role !== Role.Admin && lead.assignedTo?.email !== user.email) {
      throw new UnauthorizedException('You are not authorized to assign a lead.');
    }
    if (lead.status === LeadStatus.Converted) {
      throw new BadRequestException('Cannot create a lead activity after the lead is converted.');
    }
    const { notes, leadId, ...leadActivity } = createLeadActivityDto;
    console.log(notes, '---------------------------');

    if (notes) {
      await noteRepo.save({
        content: notes,
        entityId: lead.id,
        entityName: NotesEntityName.Lead,
        createdBy: user,
      });
    }
    await leadActivityRepo.save({
      ...leadActivity,
      leadId: lead,
      createdBy: user,
    });
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Lead activity created successfully',
    };
  }

  async findAllLeadActivities(tenantId: string, user: User, leadId: string): Promise<APIResponse> {
    const leadActivityRepo = await getRepo<LeadActivity>(LeadActivity, tenantId);
    const leadRepo = await getRepo(Lead, tenantId);
    const lead = await leadRepo.findOne({ where: { id: leadId, assignedTo: { id: user.id } } });
    const noteRepo = await getRepo(Note, tenantId);
    const notes = await noteRepo.find({
      where: { entityId: leadId, entityName: NotesEntityName.Lead },
      order: { createdAt: 'DESC' },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found or invalid lead ID.');
    }
    if (
      lead.assignedTo &&
      lead.assignedTo.id !== user.id &&
      user.role !== Role.Admin &&
      user.role !== Role.Manager
    ) {
      throw new NotFoundException('You do not have permission to view activities for this lead.');
    }
    const leadActivities = await leadActivityRepo.find({
      where: { leadId: { id: leadId } },
    });
    if (leadActivities.length === 0) {
      throw new NotFoundException('No activities found for this lead.');
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lead activities fetched successfully',
      data: { leadActivities, notes },
    };
  }
}
