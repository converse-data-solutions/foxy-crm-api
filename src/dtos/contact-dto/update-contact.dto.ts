import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateContactDto } from './create-contact.dto';
import { IsOptional, IsString } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiPropertyOptional({ example: 'Meeting on tomorrow' })
  @IsOptional()
  @IsString({ message: 'Note should be string' })
  @Sanitize()
  note?: string;
}
