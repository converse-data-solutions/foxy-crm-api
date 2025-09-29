import { Controller, Get, Post, Body, Param, Headers, Put, Query } from '@nestjs/common';
import { ContactService } from '../services/contact.service';
import { UpdateContactDto } from 'src/dto/contact-dto/update-contact.dto';
import { CreateContactDto } from 'src/dto/contact-dto/create-contact.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/enums/core-app.enum';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/database/entity/core-app/user.entity';
import { GetContactDto } from 'src/dto/contact-dto/get-contact.dto';

@Roles(Role.Admin, Role.Manager)
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Create new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Body() createContactDto: CreateContactDto,
  ) {
    return this.contactService.create(tenantId, user, createContactDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get the existing contact' })
  @ApiResponse({ status: 200, description: 'Contact fetched successfully' })
  findAll(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Query() contactQuery: GetContactDto,
  ) {
    return this.contactService.findAll(tenantId, user, contactQuery);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing contact' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  async update(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactService.update(tenantId, user, id, updateContactDto);
  }
}
