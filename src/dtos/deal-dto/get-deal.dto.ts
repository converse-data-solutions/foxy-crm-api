import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsDateString, IsInt, Min } from 'class-validator';

export class GetDealDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: 'greaterValue must be a number' })
  greaterValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({}, { message: 'lesserValue must be a number' })
  lesserValue?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fromDate must be a valid date string (YYYY-MM-DD)' })
  fromDate?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'toDate must be a valid date string (YYYY-MM-DD)' })
  toDate?: Date;

  @ApiPropertyOptional({
    default: 1,
  })
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
