import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsDefined,
  Length,
  Min,
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
    example: 5000,
    required: false,
  })
  @IsNumber()
  @Min(1, { message: 'Amount should be positive value' })
  @IsOptional()
  value?: number;

  @ApiProperty({
    description: 'Expected closing date of the opportunity',
    example: '2025-12-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expectedCloseDate?: string;

  @ApiProperty({
    description: 'Primary contact for this opportunity',
    example: 'f6a2b5c1-9d7e-4a8b-8f31-1a3d9d9e8f22',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  contactId?: string;
}
