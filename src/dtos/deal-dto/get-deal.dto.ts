import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsDecimal, IsString } from 'class-validator';
import { PageDto } from '../page-dto/page.dto';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class GetDealDto extends PageDto {
  @ApiPropertyOptional({
    description: 'Name of the opportunity',
    example: 'Acme Corp Website Redesign',
  })
  @IsOptional()
  @IsString({ message: 'Name must be string' })
  @Sanitize()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'Amount should contain maximum 2 decimal points' },
  )
  @Sanitize()
  maxValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'Amount should contain maximum 2 decimal points' },
  )
  @Sanitize()
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
