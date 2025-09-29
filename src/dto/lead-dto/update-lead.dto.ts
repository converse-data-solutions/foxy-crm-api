import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { LeadSource } from 'src/enums/core-app.enum';
import { LeadStatus } from 'src/enums/status.enum';

export class UpdateLeadDto {
  @ApiPropertyOptional({
    example: LeadStatus.Qualified,
  })
  @IsOptional()
  @IsEnum(LeadStatus, { message: 'Status must be a valid LeadStatus value' })
  status?: LeadStatus;

  @ApiPropertyOptional({
    example: 'Abc Tech',
  })
  @IsOptional()
  @IsString({ message: 'Company name must be a string' })
  @Length(5, 100, { message: 'Company must be between 5 and 100 characters' })
  company?: string;

  @ApiPropertyOptional({
    example: LeadSource.Website,
  })
  @IsOptional()
  @IsEnum(LeadSource, { message: 'Source must be a valid LeadSource value' })
  source?: LeadSource;

  @ApiPropertyOptional({
    example: '39b10f85-f293-4f0d-900f-0333f42460d7',
  })
  @IsOptional()
  @IsUUID('4', { message: 'AssignedTo must be a valid UUID v4' })
  assignedTo?: string;
}
