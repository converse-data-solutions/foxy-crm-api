import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAccountDto } from '../account-dto/create-account.dto';

export class LeadToContactDto {
  @ApiPropertyOptional({
    type: CreateAccountDto,
    description: 'Account information (optional)',
  })
  account?: CreateAccountDto;
}
