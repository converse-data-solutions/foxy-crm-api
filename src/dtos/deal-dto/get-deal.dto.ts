import { ApiPropertyOptional, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsDecimal } from 'class-validator';
import { CreateDealDto } from './create-deal.dto';
import { PageDto } from '../page-dto/page.dto';

export class GetDealDto extends IntersectionType(
  PartialType(PickType(CreateDealDto, ['name'] as const)),
  PageDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'Amount should contain maximum 2 decimal points' },
  )
  maxValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'Amount should contain maximum 2 decimal points' },
  )
  minValue?: string;

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
}
