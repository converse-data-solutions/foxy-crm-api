import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetAccountDto {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiPropertyOptional({
    example: 'Artificial Intelligence',
  })
  @IsOptional()
  @IsString({ message: 'Industry must be string type' })
  industry?: string;

  @ApiPropertyOptional({
    example: 'San Francisco',
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  city?: string;

  @ApiPropertyOptional({
    example: 'United States',
  })
  @IsOptional()
  @IsString({ message: 'Country must be string type' })
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page number must be an numeric value' })
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an numeric value' })
  @Min(1)
  limit?: number = 10;
}
