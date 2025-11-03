import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsDefined, Length } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class CreateAccountDto {
  @ApiProperty({
    example: 'Abc Data Solutions',
  })
  @IsDefined({ message: 'Name field is required' })
  @IsString({ message: 'Name must be string' })
  @Length(3, 40, { message: 'Name must be between 3 and 40 characters' })
  @Sanitize()
  name: string;

  @ApiProperty({
    example: 'Artificial Intelligence',
  })
  @IsDefined({ message: 'Industry field is required' })
  @IsString({ message: 'Industry must be string type' })
  @Length(5, 40, { message: 'Industry must be between 5 and 40 characters' })
  @Sanitize()
  industry: string;

  @ApiProperty({
    example: 'https://abc-datasolutions.com',
  })
  @IsDefined({ message: 'Website field is required' })
  @IsUrl({}, { message: 'Please give valid website url' })
  @Sanitize()
  website: string;

  @ApiPropertyOptional({
    example: '3180 18th St',
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @Length(5, 50, { message: 'Address must be between 5 and 50 characters' })
  @Sanitize()
  address?: string;

  @ApiPropertyOptional({
    example: 'San Francisco',
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @Length(3, 40, { message: 'City must be between 3 and 40 characters' })
  @Sanitize()
  city?: string;

  @ApiPropertyOptional({
    example: 'United States',
  })
  @IsOptional()
  @IsString({ message: 'Country must be string type' })
  @Sanitize()
  country?: string;
}
