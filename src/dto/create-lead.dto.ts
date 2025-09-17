import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsString } from 'class-validator';
import { LeadSource } from 'src/enum/core-app.enum';

export class CreateLeadDto {
  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'sam' })
  name: string;

  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'sam@gmail.com' })
  email: string;

  @IsDefined()
  @IsString()
  @ApiProperty({ example: '9876532458' })
  phone: string;

  @IsDefined()
  @IsString()
  @ApiPropertyOptional({ example: 'XYZ Tech Corp' })
  company?: string;

  @IsDefined()
  @IsString()
  @ApiPropertyOptional({ example: LeadSource.SocialMedia })
  source?: LeadSource;
}
