import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsDefined, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { LeadActivityType } from 'src/enums/lead-activity.enum';

export class CreateLeadActivityDto {
  @IsDefined({ message: 'Lead ID is required' })
  @IsUUID('4', { message: 'Lead ID must be a valid UUID' })
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6', description: 'UUID of the lead' })
  leadId: string;

  @IsDefined({ message: 'Activity Type is required' })
  @IsEnum(LeadActivityType, {
    message: 'Activity Type must be a valid LeadActivityType enum value',
  })
  @ApiProperty({
    example: LeadActivityType.CALL_MADE,
    enum: LeadActivityType,
    description: 'Type of activity',
  })
  activityType: LeadActivityType;

  @IsDefined({ message: 'Activity Date is required' })
  @IsDateString({}, { message: 'Activity Date must be a valid date' })
  @ApiProperty({ example: '2023-01-01T00:00:00Z', description: 'Date of the activity' })
  activityDate: Date;

  @IsOptional({ message: 'Notes are required' })
  @IsString({ message: 'Notes must be a string' })
  @ApiProperty({ example: 'Follow up with the lead', description: 'Notes about the activity' })
  notes?: string;
}
