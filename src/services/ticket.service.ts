import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Contact } from 'src/database/entities/core-app-entities/contact.entity';
import { Deal } from 'src/database/entities/core-app-entities/deal.entity';
import { Task } from 'src/database/entities/core-app-entities/task.entity';
import { Ticket } from 'src/database/entities/core-app-entities/ticket.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { MetricDto } from 'src/dtos/metric-dto/metric.dto';
import { CreateTicketDto } from 'src/dtos/ticket-dto/create-ticket.dto';
import { GetTicketDto } from 'src/dtos/ticket-dto/get-ticket.dto';
import { UpdateTicketDto } from 'src/dtos/ticket-dto/update-ticket.dto';
import { Role } from 'src/enums/core-app.enum';
import { DealStage, TaskStatus, TicketStatus } from 'src/enums/status.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { paginationParams } from 'src/shared/utils/pagination-params.util';
import { MetricService } from './metric.service';
import { Not } from 'typeorm';
@Injectable()
export class TicketService {
  constructor(private readonly metricService: MetricService) {}
  async createTicket(
    tenantId: string,
    user: User,
    createTicketDto: CreateTicketDto,
  ): Promise<APIResponse> {
    const ticketRepo = await getRepo(Ticket, tenantId);
    const dealRepo = await getRepo(Deal, tenantId);
    const contactRepo = await getRepo(Contact, tenantId);
    const { dealId, contactId, ...createTicket } = createTicketDto;
    const dealExist = await dealRepo.findOne({ where: { id: dealId } });
    if (!dealExist) {
      throw new BadRequestException('Invalid deal id or deal not found');
    }
    if (dealExist.stage === DealStage.Declined) {
      throw new BadRequestException('Cannot raise ticket for unaccepted deal');
    }
    if (dealExist.stage === DealStage.Accepted) {
      throw new BadRequestException('Cannot raise ticket for incomplete deal');
    }
    const ticketExist = await ticketRepo.findOne({
      where: { title: createTicketDto.title, dealId: { id: dealExist.id } },
    });
    if (ticketExist) {
      throw new ConflictException('Ticket with this name is already created');
    }
    const contactExist = await contactRepo.findOne({ where: { id: contactId } });
    if (!contactExist && contactId) {
      throw new BadRequestException('Invalid contact id or contact not found');
    }
    const ticket = ticketRepo.create({
      dealId: dealExist,
      contactId: contactExist ?? undefined,
      createdBy: user,
      ...createTicket,
    });
    await ticketRepo.save(ticket);
    const metric: Partial<MetricDto> = { tickets: 1 };
    await this.metricService.updateTenantCounts(tenantId, metric);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Ticket raised or created successfully',
    };
  }

  async findAllTickets(
    tenantId: string,
    user: User,
    ticketQuery: GetTicketDto,
  ): Promise<APIResponse> {
    const ticketRepo = await getRepo(Ticket, tenantId);
    const qb = ticketRepo.createQueryBuilder('ticket').leftJoin('ticket.dealId', 'deal');

    const { limit, page, skip } = paginationParams(ticketQuery.page, ticketQuery.limit);

    for (const [key, value] of Object.entries(ticketQuery)) {
      if (value == null || key === 'page' || key === 'limit') {
        continue;
      } else if (key === 'title') {
        qb.andWhere(`ticket.title ILIKE :title`, { title: `%${value}%` });
      } else if (key === 'status') {
        qb.andWhere(`ticket.status =:status`, { status: value });
      } else if (key === 'deal') {
        qb.andWhere(`deal.name ILIKE :deal`, { deal: `%${value}%` });
      } else if (key === 'resolvedFrom') {
        qb.andWhere(`ticket.resolved_at >=:resolvedFrom`, { resolvedFrom: value });
      } else if (key === 'resolvedTo') {
        qb.andWhere(`ticket.resolved_at <=:resolvedTo`, { resolvedTo: value });
      }
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    const pageInfo = { total, limit, page, totalPages: Math.ceil(total / limit) };
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Ticket details fetched based on filter',
      data,
      pageInfo,
    };
  }

  async updateTicket(
    tenantId: string,
    user: User,
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<APIResponse> {
    const ticketRepo = await getRepo(Ticket, tenantId);
    const taskRepo = await getRepo(Task, tenantId);
    const ticketTasks = await taskRepo.find({ where: { entityId: id } });
    const existTicket = await ticketRepo.findOne({ where: { id } });
    if (!existTicket) {
      throw new BadRequestException('Invalid ticket id or ticket not found');
    }

    if (updateTicketDto.status) {
      if (![TicketStatus.Open, TicketStatus.InProgress].includes(updateTicketDto.status)) {
        // Handle Resolved/Closed rules
        if (
          ticketTasks.length === 0 &&
          [TicketStatus.Closed, TicketStatus.Resolved].includes(updateTicketDto.status)
        ) {
          throw new BadRequestException('Cannot close or resolve a ticket without any tasks');
        }

        for (const task of ticketTasks) {
          if (task.status !== TaskStatus.Completed) {
            throw new BadRequestException('Cannot close or resolve a ticket with pending tasks');
          }
        }

        if (
          user.role !== Role.Admin &&
          user.role !== Role.Manager &&
          updateTicketDto.status === TicketStatus.Closed
        ) {
          throw new UnauthorizedException('Not authorized to close the ticket');
        }

        if (
          existTicket.status !== TicketStatus.Resolved &&
          updateTicketDto.status === TicketStatus.Closed
        ) {
          throw new BadRequestException('Cannot close a ticket without resolving it first');
        }

        //  Apply Resolved/Closed update
        existTicket.status = updateTicketDto.status;
        existTicket.resolvedAt =
          updateTicketDto.status === TicketStatus.Resolved ? new Date() : undefined;
      } else {
        //  Allow Open/InProgress update
        existTicket.status = updateTicketDto.status;
      }
    }
    if (
      (updateTicketDto.title || updateTicketDto.description) &&
      ![Role.Admin, Role.Manager].includes(user.role)
    ) {
      throw new UnauthorizedException('Not have authorization to update ticket details');
    }
    if (updateTicketDto.title) {
      const ticketExist = await ticketRepo.findOne({
        where: { id: Not(existTicket.id), title: updateTicketDto.title },
      });
      if (ticketExist) {
        throw new ConflictException('Ticket with this name is already exist');
      }
    }

    await ticketRepo.save({
      ...existTicket,
      title: updateTicketDto.title,
      description: updateTicketDto.description,
      updatedBy: user,
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Ticket info updated successfully',
    };
  }
}
