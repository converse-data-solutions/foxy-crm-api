import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDecimal } from 'class-validator';
import { DealStage } from 'src/enums/status.enum';
import { CreateDealDto } from './create-deal.dto';

export class UpdateDealDto extends PartialType(
  OmitType(CreateDealDto, ['expectedCloseDate', 'contactId']),
) {
  @ApiPropertyOptional({ description: 'Stage of the deal', example: DealStage.Accepted })
  @IsOptional()
  @IsEnum(DealStage, { message: 'Stage must be a valid DealStage enum value' })
  stage?: DealStage;
}
