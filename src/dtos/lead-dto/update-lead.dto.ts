import { ApiPropertyOptional, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { LeadStatus } from 'src/enums/status.enum';
import { CreateLeadDto } from './create-lead.dto';
import { LeadToContactDto } from './lead-to-contact.dto';

export class UpdateLeadDto extends IntersectionType(
  PartialType(OmitType(CreateLeadDto, ['name', 'email', 'phone'])),
  LeadToContactDto,
) {
  @ApiPropertyOptional({
    example: LeadStatus.Qualified,
  })
  @IsOptional()
  @IsEnum(LeadStatus, { message: 'Status must be a valid LeadStatus value' })
  status?: LeadStatus;
}
