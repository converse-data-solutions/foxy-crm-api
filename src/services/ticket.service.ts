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
import { applyFilters, FiltersMap } from 'src/shared/utils/query-filter.util';
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
      throw new BadRequestException('Invalid deal ID. Please provide a valid deal.');
    }
    if (dealExist.stage === DealStage.Declined) {
      throw new BadRequestException('Cannot create a ticket for a declined deal.');
    }
    if (dealExist.stage !== DealStage.Completed) {
      throw new BadRequestException('Cannot create a ticket for an incomplete deal.');
    }
    const ticketExist = await ticketRepo.findOne({
      where: { title: createTicketDto.title, dealId: { id: dealExist.id } },
    });
    if (ticketExist) {
      throw new ConflictException('A ticket with this title already exists for the selected deal.');
    }
    const contactExist = await contactRepo.findOne({ where: { id: contactId } });
    if (!contactExist && contactId) {
      throw new BadRequestException('Invalid contact ID. Please select a valid contact.');
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
    const qb = ticketRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.dealId', 'deal')
      .leftJoinAndSelect('ticket.contactId', 'contact')
      .leftJoin('ticket.createdBy', 'user');
    const { limit, page, skip } = paginationParams(ticketQuery.page, ticketQuery.limit);
    const FILTERS: FiltersMap = {
      title: { column: 'ticket.title', type: 'ilike' },
      deal: { column: 'deal.name', type: 'ilike' },
      resolvedFrom: { column: 'ticket.resolved_at', type: 'gte' },
      resolvedTo: { column: 'ticket.resolved_at', type: 'lte' },
    };
    applyFilters(qb, FILTERS, ticketQuery);

    if (ticketQuery.sortBy) {
      qb.orderBy(`ticket.${ticketQuery.sortBy}`, ticketQuery.sortDirection);
    }
    if (![Role.Admin, Role.Manager, Role.SuperAdmin].includes(user.role)) {
      qb.andWhere(`user.id =:id`, { id: user.id });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    const tickets = data.map(({ dealId, contactId, ...ticket }) => {
      return { ...ticket, dealId: dealId.id, contactId: contactId.id };
    });
    const pageInfo = { total, limit, page, totalPages: Math.ceil(total / limit) };
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Ticket details fetched based on filter',
      data: tickets,
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
      throw new BadRequestException('Invalid ticket ID. Ticket not found.');
    }

    if (updateTicketDto.status) {
      if (![TicketStatus.Open, TicketStatus.InProgress].includes(updateTicketDto.status)) {
        // Handle Resolved/Closed rules
        if (
          ticketTasks.length === 0 &&
          [TicketStatus.Closed, TicketStatus.Resolved].includes(updateTicketDto.status)
        ) {
          throw new BadRequestException(
            'Cannot close or resolve a ticket with no associated tasks.',
          );
        }

        for (const task of ticketTasks) {
          if (task.status !== TaskStatus.Completed) {
            throw new BadRequestException('Cannot close or resolve a ticket with pending tasks.');
          }
        }

        if (
          user.role !== Role.Admin &&
          user.role !== Role.Manager &&
          user.role !== Role.SuperAdmin &&
          updateTicketDto.status === TicketStatus.Closed
        ) {
          throw new UnauthorizedException('You are not authorized to close this ticket.');
        }

        if (
          existTicket.status !== TicketStatus.Resolved &&
          updateTicketDto.status === TicketStatus.Closed
        ) {
          throw new BadRequestException('You must resolve a ticket before closing it.');
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
      ![Role.Admin, Role.Manager, Role.SuperAdmin].includes(user.role)
    ) {
      throw new UnauthorizedException('You are not authorized to update ticket details.');
    }
    if (updateTicketDto.title) {
      const ticketExist = await ticketRepo.findOne({
        where: { id: Not(existTicket.id), title: updateTicketDto.title },
      });
      if (ticketExist) {
        throw new ConflictException('A ticket with this title already exists.');
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
