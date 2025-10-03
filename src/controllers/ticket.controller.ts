import { Controller, Get, Post, Body, Param, Put, Headers, Query } from '@nestjs/common';
import { TicketService } from '../services/ticket.service';
import { UpdateTicketDto } from 'src/dtos/ticket-dto/update-ticket.dto';
import { CreateTicketDto } from 'src/dtos/ticket-dto/create-ticket.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/enums/core-app.enum';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { GetTicketDto } from 'src/dtos/ticket-dto/get-ticket.dto';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @Roles(Role.Admin, Role.Manager, Role.SalesRep, Role.Support)
  @ApiOperation({ summary: 'Create ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async createTicket(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Body() createTicketDto: CreateTicketDto,
  ) {
    return await this.ticketService.createTicket(tenantId, user, createTicketDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Support)
  @ApiOperation({ summary: 'Retrive ticket' })
  @ApiResponse({ status: 200, description: 'Ticket details fetched successfully' })
  async findAllTickets(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Query() ticketQuery: GetTicketDto,
  ) {
    return await this.ticketService.findAllTickets(tenantId, user, ticketQuery);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Manager, Role.Support)
  @ApiOperation({ summary: 'Update ticket' })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  async updateTicket(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return await this.ticketService.updateTicket(tenantId, user, id, updateTicketDto);
  }
}
