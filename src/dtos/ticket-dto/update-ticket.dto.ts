import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TicketStatus } from 'src/enums/status.enum';
import { CreateTicketDto } from './create-ticket.dto';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class UpdateTicketDto extends PartialType(
  OmitType(CreateTicketDto, ['dealId', 'contactId']),
) {
  @ApiPropertyOptional({
    description: 'Updated status of the ticket',
    enum: TicketStatus,
    example: TicketStatus.InProgress,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  @Sanitize()
  status?: TicketStatus;
}
