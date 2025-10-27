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
  UseGuards,
  Res,
} from '@nestjs/common';
import { LeadService } from '../services/lead.service';
import { CreateLeadDto } from '../dtos/lead-dto/create-lead.dto';
import { UpdateLeadDto } from '../dtos/lead-dto/update-lead.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadQueryDto } from 'src/dtos/lead-dto/get-lead.dto';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/enums/core-app.enum';
import { LeadToContactDto } from 'src/dtos/lead-dto/lead-to-contact.dto';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { FileValidationPipe } from 'src/common/pipes/file-validation.pipe';
import { LeadConversionService } from 'src/services/lead-conversion.service';
import { CsrfGuard } from 'src/guards/csrf.guard';
import { CsrfHeader } from 'src/common/decorators/csrf-header.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { Response } from 'express';
import path from 'path';

@Roles(Role.Admin, Role.Manager)
@Controller('leads')
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly leadConversionService: LeadConversionService,
  ) {}

  @Post()
  @UseGuards(CsrfGuard)
  @CsrfHeader()
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Insert lead or create lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  async createLead(
    @Headers('x-tenant-id') tenantId: string,
    @Body() createLeadDto: CreateLeadDto,
    @CurrentUser() user: User,
  ) {
    return await this.leadService.createLead(createLeadDto, tenantId, user);
  }

  @Post('upload')
  @UseGuards(CsrfGuard)
  @CsrfHeader()
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
    return this.leadService.importLeads(file, tenantId, user);
  }

  @Post(':id/conversion')
  @UseGuards(CsrfGuard)
  @CsrfHeader()
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Convert lead to contact' })
  @ApiResponse({ status: 200, description: 'Lead converted successfully' })
  async convertLead(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() leadToContact?: LeadToContactDto,
  ) {
    return await this.leadConversionService.convertLead(tenantId, id, user, leadToContact);
  }

  @Get(':id/conversion-preview')
  @ApiOperation({ summary: 'Retrive lead preview' })
  @ApiResponse({ status: 200, description: 'Lead preview fetched successfully' })
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  async leadPreview(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return await this.leadConversionService.leadPreview(tenantId, id);
  }

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Retrive lead based on query' })
  @ApiResponse({ status: 200, description: 'Lead fetched successfully' })
  async findAllLeads(
    @Query() leadQuery: LeadQueryDto,
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
  ) {
    return this.leadService.findAllLeads(leadQuery, tenantId, user);
  }

  @Get('template')
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Download the Lead Import Template' })
  async downloadTemplate(@Res() res: Response, @Headers('x-tenant-id') tenantId: string) {
    const filePath = path.join(__dirname, '../templates/lead-import-template.csv');
    return res.download(filePath, 'lead-import-template.csv');
  }

  @Put(':id')
  @UseGuards(CsrfGuard)
  @CsrfHeader()
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
