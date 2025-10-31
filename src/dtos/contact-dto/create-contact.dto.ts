import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'John Doe' })
  @IsDefined({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @Length(2, 30, { message: 'Name must be between 2 and 30 characters' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsDefined({ message: 'Email is required' })
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  @Length(5, 50, { message: 'Email must be between 5 and 50 characters' })
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsDefined({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9\- ]{7,20}$/, {
    message: 'Phone must be a valid number and may include country code',
  })
  @Length(6, 20, { message: 'Phone must be between 6 and 20 characters' })
  phone: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString({ message: 'Account should be string' })
  account?: string;

  @ApiPropertyOptional({ example: '10495caf-7023-40cf-be93-dc26f62569de' })
  @IsOptional()
  @IsUUID('4', { message: 'Assigned should be UUID' })
  assignedTo?: string;
}
