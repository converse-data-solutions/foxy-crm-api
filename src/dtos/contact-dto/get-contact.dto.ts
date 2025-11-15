import { ApiPropertyOptional, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateContactDto } from './create-contact.dto';
import { PageDto } from '../page-dto/page.dto';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class GetContactDto extends IntersectionType(
  PartialType(OmitType(CreateContactDto, ['account', 'assignedTo'] as const)),
  PageDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Account should be string' })
  @Sanitize()
  accountName?: string;
}
