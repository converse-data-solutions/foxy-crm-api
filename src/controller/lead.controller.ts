import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
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
  async findAll() {
    return this.leadService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.leadService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadService.update(+id, updateLeadDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.leadService.remove(+id);
  }
}
