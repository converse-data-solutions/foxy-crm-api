import { IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { CreateAccountDto } from './create-account.dto';
import { PageDto } from '../page-dto/page.dto';

export class GetAccountDto extends IntersectionType(
  PartialType(OmitType(CreateAccountDto, ['website', 'address'] as const)),
  PageDto,
) {}
