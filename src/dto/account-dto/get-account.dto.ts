import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class GetAccountDto {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(2, 30, { message: 'Name must be between 2 and 30 characters' })
  name?: string;

  @ApiPropertyOptional({
    example: 'Artificial Intelligence',
  })
  @IsOptional()
  @IsString({ message: 'Industry must be string type' })
  @Length(5, 20, { message: 'Industry must be between 5 and 20 characters' })
  industry?: string;

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
