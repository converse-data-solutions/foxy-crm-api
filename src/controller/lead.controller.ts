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
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JwtPayload } from 'src/dto/jwt-payload.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadQueryDto } from 'src/dto/lead-query.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/enum/core-app.enum';

@Controller('lead')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @ApiOperation({ summary: 'Insert lead or create lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  async create(
    @Body() createLeadDto: CreateLeadDto,
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.leadService.create(createLeadDto, tenantId, user);
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
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: 422,
        }),
    )
    file: Express.Multer.File,
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.leadService.importLeads(file, tenantId, user);
  }

  @Get()
  @Roles(Role.Admin, Role.Manager)
  @ApiOperation({ summary: 'Retrive lead based on query' })
  @ApiResponse({ status: 200, description: 'Lead fetched successfully' })
  async findAll(
    @Query() leadQuery: LeadQueryDto,
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadService.findAll(leadQuery, tenantId, user);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Manager)
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.leadService.update(id, updateLeadDto, tenantId, user);
  }

}
