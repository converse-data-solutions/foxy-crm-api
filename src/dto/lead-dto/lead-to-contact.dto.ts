import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class AccountField {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsDefined({ message: 'Name field is required' })
  @IsString({ message: 'Name must be string' })
  @Length(2, 30, { message: 'Name must be between 2 and 30 characters' })
  name: string;

  @ApiProperty({ example: 'Technology' })
  @IsDefined({ message: 'Industry field is required' })
  @IsString({ message: 'Industry must be string' })
  @Length(2, 20, { message: 'Industry must be between 2 and 20 characters' })
  industry: string;

  @ApiProperty({ example: 'https://acme.com' })
  @IsDefined({ message: 'Website field is required' })
  @IsUrl({},{ message: 'Please give valid website url' })
  website: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString({ message: 'Address must be string' })
  @Length(5, 50, { message: 'Address must be between 5 and 50 characters' })
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString({ message: 'City must be string' })
  @Length(3, 20, { message: 'City must be between 3 and 20 characters' })
  city?: string;

  @ApiPropertyOptional({ example: 'USA' })
  country?: string;
}

export class LeadToContactDto {
  @ApiPropertyOptional({
    type: AccountField,
    description: 'Account information (optional)',
  })
  account?: AccountField;
}
