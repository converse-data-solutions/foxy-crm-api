import { IsDefined, IsEmail, IsOptional, IsString, IsUrl, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantSignupDto {
  @IsDefined({ message: 'Organization name is required' })
  @IsString({ message: 'Organization name must be a string' })
  @ApiProperty({ example: 'Abc Tech' })
  organizationName: string;

  @IsDefined({ message: 'User name is required' })
  @IsString({ message: 'User name must be a string' })
  @ApiProperty({ example: 'navaneethan' })
  userName: string;

  @IsDefined({ message: 'Email is required' })
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  @ApiProperty({ example: 'navaneethan@conversedatasolutions.com' })
  email: string;

  @IsDefined({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9\- ]{7,20}$/, {
    message: 'Phone must be a valid number and may include country code',
  })
  @ApiProperty({ example: '9876532458' })
  phone: string;

  @IsDefined({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @ApiProperty({ example: 'pa$$w0rd' })
  password: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL must be a string' })
  @ApiPropertyOptional({ example: 'http://www.abctech.in' })
  url?: string;

  @IsOptional()
  @IsString({message:'Country should be string'})
  @ApiProperty({ example: 'India' })
  country?: string
}
