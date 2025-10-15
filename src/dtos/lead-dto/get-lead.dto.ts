import { IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { CreateLeadDto } from './create-lead.dto';
import { PageDto } from '../page-dto/page.dto';

export class LeadQueryDto extends IntersectionType(
  PartialType(OmitType(CreateLeadDto, ['assignedTo'] as const)),
  PageDto,
) {}
