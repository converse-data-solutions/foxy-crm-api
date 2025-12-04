import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PageDto } from '../page-dto/page.dto';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class GetTicketDto extends PageDto {
  @ApiPropertyOptional({ description: 'Title of the support ticket', example: 'Payment issue' })
  @IsOptional()
  @IsString({ message: 'Title should be a type of string' })
  @Sanitize()
  title: string;

  @ApiPropertyOptional({
    example: 'Acme Corp Website design',
    description: 'Filter tickets by deal name',
  })
  @IsOptional()
  @IsString()
  @Sanitize()
  deal?: string;

  @ApiPropertyOptional({
    description: 'Filter tickets resolved from this date (inclusive)',
    example: '2025-12-03 10:53:00',
  })
  @IsOptional()
  @IsDateString()
  resolvedFrom?: Date;

  @ApiPropertyOptional({
    example: '2025-12-05 10:53:00',
    description: 'Filter tickets resolved up to this date (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  resolvedTo?: Date;
}
