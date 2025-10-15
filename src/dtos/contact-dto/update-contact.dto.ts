import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateContactDto } from './create-contact.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiPropertyOptional({ example: 'Meeting on tomorrow' })
  @IsOptional()
  @IsString({ message: 'Note should be string' })
  note?: string;
}
