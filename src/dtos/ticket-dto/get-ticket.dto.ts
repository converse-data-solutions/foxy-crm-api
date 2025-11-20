import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { TicketStatus } from 'src/enums/status.enum';
import { PageDto } from '../page-dto/page.dto';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class GetTicketDto extends PageDto {
  @ApiPropertyOptional({ description: 'Title of the support ticket', example: 'Payment issue' })
  @IsOptional()
  @IsString({ message: 'Title should be a type of string' })
  @Sanitize()
  title: string;

  @ApiPropertyOptional({
    description: 'Sort ticket by status ASC or DESC',
    example: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'status must be ASC or DESC' })
  status?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Filter tickets by deal name',
  })
  @IsOptional()
  @IsString()
  @Sanitize()
  deal?: string;

  @ApiPropertyOptional({
    description: 'Filter tickets resolved from this date (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  resolvedFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter tickets resolved up to this date (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  resolvedTo?: Date;
}
