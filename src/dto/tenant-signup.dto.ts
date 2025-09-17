import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsOptional, IsString } from 'class-validator';

export class TenantSignupDto {
  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'Abc Tech' })
  organizationName: string;

  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'navaneethan' })
  userName: string;

  @IsDefined()
  @IsEmail()
  @ApiProperty({ example: 'navaneethan@conversedatasolutions.com' })
  email: string;

  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'pa$$w0rd' })
  password: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'http://www.abctech.in' })
  url?: string;
}
