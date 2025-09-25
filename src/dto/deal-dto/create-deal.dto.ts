import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsDefined,
  Length,
  Min,
  IsDecimal,
} from 'class-validator';

export class CreateDealDto {
  @ApiProperty({
    description: 'Name of the opportunity',
    example: 'Acme Corp Website Redesign',
  })
  @IsDefined({ message: 'Name field is required' })
  @IsString({ message: 'Name must be string' })
  @Length(3, 40, { message: 'Name must be between 3 and 40 characters' })
  name: string;

  @ApiProperty({
    description: 'Opportunity value or deal size',
    example: '5000',
    required: false,
  })
  @IsDefined({ message: 'Amount should be required' })
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'Amount should contain maximum 2 decimal points' },
  )
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
  @IsUUID()
  contactId: string;
}
