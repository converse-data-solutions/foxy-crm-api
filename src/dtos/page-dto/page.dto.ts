import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class PageDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page number must be an numeric value' })
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an numeric value' })
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'field name', example: 'name' })
  @IsOptional()
  @IsString({ message: 'Sort by should be a string' })
  @Sanitize()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction either ASC or DESC',
    example: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'sortDirection must be ASC or DESC' })
  sortDirection?: 'ASC' | 'DESC';
}
