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
import { LeadService } from '../services/lead.service';
import { CreateLeadDto } from '../dtos/lead-dto/create-lead.dto';
import { UpdateLeadDto } from '../dtos/lead-dto/update-lead.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadQueryDto } from 'src/dtos/lead-dto/lead-query.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/enums/core-app.enum';
import { LeadToContactDto } from 'src/dtos/lead-dto/lead-to-contact.dto';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { FileValidationPipe } from 'src/common/pipes/file-validation.pipe';

@Roles(Role.Admin, Role.Manager)
@Controller('lead')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Insert lead or create lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  async createLead(
    @Body() createLeadDto: CreateLeadDto,
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
  ) {
    return await this.leadService.createLead(createLeadDto, tenantId, user);
  }

  @Post('upload')
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
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 200 * 1024 })
        .addValidator(new FileValidationPipe())
        .build({
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
  @ApiOperation({ summary: 'Retrive lead based on query' })
  @ApiResponse({ status: 200, description: 'Lead fetched successfully' })
  async findAllLeads(@Query() leadQuery: LeadQueryDto, @Headers('x-tenant-id') tenantId: string) {
    return this.leadService.findAllLeads(leadQuery, tenantId);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Update lead data' })
  @ApiResponse({ status: 200, description: 'Lead updated successfully' })
  async updateLead(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateLeadDto: UpdateLeadDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.leadService.updateLead(id, user, updateLeadDto, tenantId);
  }
}
