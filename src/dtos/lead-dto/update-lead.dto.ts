import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { LeadStatus } from 'src/enums/status.enum';
import { CreateLeadDto } from './create-lead.dto';

export class UpdateLeadDto extends PartialType(
  OmitType(CreateLeadDto, ['name', 'email', 'phone']),
) {
  @ApiPropertyOptional({
    example: LeadStatus.Qualified,
  })
  @IsOptional()
  @IsEnum(LeadStatus, { message: 'Status must be a valid LeadStatus value' })
  status?: LeadStatus;
}
