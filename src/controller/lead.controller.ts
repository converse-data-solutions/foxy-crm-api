import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  Query,
  Put,
} from '@nestjs/common';
import { LeadService } from '../service/lead.service';
import { CreateLeadDto } from '../dto/lead-dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/lead-dto/update-lead.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadQueryDto } from 'src/dto/lead-dto/lead-query.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/enum/core-app.enum';
import { LeadToContactDto } from 'src/dto/lead-dto/lead-to-contact.dto';
import { User } from 'src/database/entity/core-app/user.entity';

@Controller('lead')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @ApiOperation({ summary: 'Insert lead or create lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  async create(
    @Body() createLeadDto: CreateLeadDto,
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
  ) {
    return await this.leadService.create(createLeadDto, tenantId, user);
  }

  @Post('upload')
  @Roles(Role.Admin, Role.Manager)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload CSV for bulk lead import' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importLeads(
    @UploadedFile(
      new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 200 * 1024 }).build({
        fileIsRequired: true,
        errorHttpStatusCode: 422,
      }),
    )
    file: Express.Multer.File,
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
  ) {
    return await this.leadService.importLeads(file, tenantId, user);
  }

  @Post(':id/convert')
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Convert lead to contact' })
  @ApiResponse({ status: 200, description: 'Lead converted successfully' })
  async convertLead(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() leadToContact?: LeadToContactDto,
  ) {
    return await this.leadService.convertLead(tenantId, id, user, leadToContact);
  }

  @Get(':id/convert-preview')
  @ApiOperation({ summary: 'Retrive lead preview' })
  @ApiResponse({ status: 200, description: 'Lead preview fetched successfully' })
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  async leadPreview(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return await this.leadService.leadPreview(tenantId, id);
  }

  @Get()
  @Roles(Role.Admin, Role.Manager)
  @ApiOperation({ summary: 'Retrive lead based on query' })
  @ApiResponse({ status: 200, description: 'Lead fetched successfully' })
  async findAll(@Query() leadQuery: LeadQueryDto, @Headers('x-tenant-id') tenantId: string) {
    return this.leadService.findAll(leadQuery, tenantId);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Update lead data' })
  @ApiResponse({ status: 200, description: 'Lead updated successfully' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateLeadDto: UpdateLeadDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.leadService.update(id, user, updateLeadDto, tenantId);
  }
}
