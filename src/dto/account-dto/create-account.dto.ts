import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsDefined, Length } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    example: 'Abc Data Solutions',
  })
  @IsDefined({ message: 'Name field is required' })
  @IsString({ message: 'Name must be string' })
  @Length(3, 30, { message: 'Name must be between 3 and 30 characters' })
  name: string;

  @ApiProperty({
    example: 'Artificial Intelligence',
  })
  @IsDefined({ message: 'Industry field is required' })
  @IsString({ message: 'Industry must be string type' })
  @Length(5, 20, { message: 'Industry must be between 5 and 20 characters' })
  industry: string;

  @ApiProperty({
    example: 'https://abc-datasolutions.com',
  })
  @IsDefined({ message: 'Website field is required' })
  @IsUrl({}, { message: 'Please give valid website url' })
  website: string;

  @ApiPropertyOptional({
    example: '3180 18th St',
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @Length(5, 50, { message: 'Address must be between 5 and 50 characters' })
  address?: string;

  @ApiPropertyOptional({
    example: 'San Francisco',
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @Length(3, 20, { message: 'City must be between 3 and 20 characters' })
  city?: string;

  @ApiPropertyOptional({
    example: 'United States',
  })
  @IsOptional()
  @IsString({ message: 'Country must be string type' })
  country?: string;
}
