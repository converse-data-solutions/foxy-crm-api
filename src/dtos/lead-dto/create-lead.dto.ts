import { IsDefined, IsEnum, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource } from 'src/enums/core-app.enum';

export class CreateLeadDto {
  @IsDefined({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @ApiProperty({ example: 'sam' })
  @Length(2, 30, { message: 'Name must be between 2 and 30 characters' })
  name: string;

  @IsDefined({ message: 'Email is required' })
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  @ApiProperty({ example: 'sam@gmail.com' })
  @Length(5, 50, { message: 'Email must be between 5 and 50 characters' })
  email: string;

  @IsDefined({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9\- ]{7,20}$/, {
    message: 'Phone must be a valid number and may include country code',
  })
  @Length(5, 20, { message: 'Phone must be between 2 and 30 characters' })
  @ApiProperty({ example: '9876532458' })
  phone: string;

  @IsOptional()
  @IsString({ message: 'Company name must be a string' })
  @ApiPropertyOptional({ example: 'XYZ Tech Corp' })
  @Length(5, 100, { message: 'Company must be between 5 and 100 characters' })
  company?: string;

  @IsEnum(LeadSource, {
    message: `Source must be a valid lead source (${Object.values(LeadSource).join(', ')})`,
  })
  @ApiPropertyOptional({ example: LeadSource.SocialMedia })
  source?: LeadSource;

  @ApiPropertyOptional({ example: '10495caf-7023-40cf-be93-dc26f62569de' })
  @IsOptional()
  @IsUUID('4', { message: 'Assigned should be UUID' })
  assignedTo?: string;
}
