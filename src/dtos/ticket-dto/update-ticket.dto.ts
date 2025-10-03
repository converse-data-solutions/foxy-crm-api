import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketStatus } from 'src/enums/status.enum';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    example: 'Login issue on mobile app',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'User unable to login using Google OAuth on Android app.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated status of the ticket',
    enum: TicketStatus,
    example: TicketStatus.InProgress,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
