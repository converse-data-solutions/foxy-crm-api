import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString, IsUUID } from 'class-validator';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class CreateTicketDto {
  @ApiProperty({ description: 'Title of the support ticket', example: 'Payment issue' })
  @IsDefined({ message: 'Title is required' })
  @IsString({ message: 'Title should be a type of string' })
  @Sanitize()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'Unable to process payment via credit card',
  })
  @IsDefined({ message: 'Description is required' })
  @IsString({ message: 'Description should be a type of string' })
  @Sanitize()
  description: string;

  @ApiPropertyOptional({
    description: 'ID of the related contact',
    example: 'a3f3f1f0-7c5e-4a83-b5c4-97d2e4c8d9a1',
  })
  @IsOptional({ message: 'Contact id is required' })
  @IsUUID('4', { message: 'Contact id should be UUID' })
  contactId?: string;

  @ApiProperty({
    description: 'ID of the related deal (optional)',
    example: 'd7c7e9f1-54b1-41dd-93a6-1e2452c4c217',
    required: false,
  })
  @IsDefined({ message: 'Deal id is required' })
  @IsString({ message: 'Deal id should be UUID' })
  @IsUUID('4', { message: 'Deal ID should be a UUID' })
  dealId: string;
}
