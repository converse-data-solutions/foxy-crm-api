import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDecimal } from 'class-validator';
import { DealStage } from 'src/enum/status.enum';

export class UpdateDealDto {
  @ApiPropertyOptional({ description: 'Name of the deal', type: String })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiPropertyOptional({ description: 'Deal value' })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'Amount should contain maximum 2 decimal points' },
  )
  value?: string;

  @ApiPropertyOptional({ description: 'Stage of the deal', enum: DealStage })
  @IsOptional()
  @IsEnum(DealStage, { message: 'Stage must be a valid DealStage enum value' })
  stage?: DealStage;
}
