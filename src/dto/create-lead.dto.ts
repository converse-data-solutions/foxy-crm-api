import { IsDefined, IsEnum, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource } from 'src/enum/core-app.enum';

export class CreateLeadDto {
  @IsDefined({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @ApiProperty({ example: 'sam' })
  name: string;

  @IsDefined({ message: 'Email is required' })
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  @ApiProperty({ example: 'sam@gmail.com' })
  email: string;

  @IsDefined({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9\- ]{7,20}$/, {
    message:
      'Phone must be a valid number and may include country code',
  })
  @ApiProperty({ example: '9876532458' })
  phone: string;

  @IsString({ message: 'Company name must be a string' })
  @ApiPropertyOptional({ example: 'XYZ Tech Corp' })
  company?: string;

  @IsEnum(LeadSource, {
  message: `Source must be a valid lead source (${Object.values(LeadSource).join(', ')})`,
})
  @ApiPropertyOptional({ example: LeadSource.SocialMedia })
  source?: LeadSource;
}
