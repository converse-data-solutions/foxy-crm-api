import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateContactDto } from './create-contact.dto';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiPropertyOptional({ example: 'Meeting on tomorrow' })
  @IsOptional()
  @IsString({ message: 'Note should be string' })
  note?: string;

  @ApiPropertyOptional({ example: '10495caf-7023-40cf-be93-dc26f62569de' })
  @IsOptional()
  @IsUUID('4', { message: 'Assigned should be UUID' })
  assignedTo?: string;
}
