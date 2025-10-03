import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsInt,
  Min,
  IsDecimal,
} from 'class-validator';

export class GetDealDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'Amount should contain maximum 2 decimal points' },
  )
  greaterValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'Amount should contain maximum 2 decimal points' },
  )
  lesserValue?: string;

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
