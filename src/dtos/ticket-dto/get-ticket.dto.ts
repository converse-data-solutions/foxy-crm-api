import { ApiPropertyOptional, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { TicketStatus } from 'src/enums/status.enum';
import { CreateTicketDto } from './create-ticket.dto';
import { PageDto } from '../page-dto/page.dto';

export class GetTicketDto extends IntersectionType(
  PartialType(PickType(CreateTicketDto, ['title'] as const)),
  PageDto,
) {
  @ApiPropertyOptional({
    description: 'Filter tickets by status',
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Filter tickets by deal name',
  })
  @IsOptional()
  @IsString()
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
