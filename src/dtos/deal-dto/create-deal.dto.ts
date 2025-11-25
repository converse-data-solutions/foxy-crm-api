import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsDefined,
  Length,
  Matches,
} from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class CreateDealDto {
  @ApiProperty({
    description: 'Name of the opportunity',
    example: 'Acme Corp Website Redesign',
  })
  @IsDefined({ message: 'Name field is required' })
  @IsString({ message: 'Name must be string' })
  @Length(2, 40, { message: 'Name must be between 2 and 40 characters' })
  @Sanitize()
  name: string;

  @ApiProperty({
    description: 'Opportunity value or deal size',
    example: '5000',
    required: false,
  })
  @IsDefined({ message: 'Amount should be required' })
  @Matches(/^\d+(?:\.\d{1,2})?$/, {
    message: 'Amount must be a number with up to 2 decimal digits',
  })
  value: string;

  @ApiPropertyOptional({
    description: 'Expected closing date of the opportunity',
    example: '2025-12-01',
    required: false,
  })
  @IsDateString({}, { message: 'Expected close date must be a date' })
  @IsOptional()
  expectedCloseDate?: string;

  @ApiProperty({
    description: 'Primary contact for this opportunity',
    example: 'f6a2b5c1-9d7e-4a8b-8f31-1a3d9d9e8f22',
    required: false,
  })
  @IsDefined({ message: 'Contact id is required' })
  @IsUUID('4', { message: 'Contact ID should be UUID' })
  contactId: string;
}
