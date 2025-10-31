import { ApiPropertyOptional, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateContactDto } from './create-contact.dto';
import { PageDto } from '../page-dto/page.dto';

export class GetContactDto extends IntersectionType(
  PartialType(OmitType(CreateContactDto, ['account', 'assignedTo'] as const)),
  PageDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Account should be string' })
  accountName?: string;
}
