import { IsDefined, IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class TenantSignupDto {
  @IsDefined({ message: 'Organization name is required' })
  @IsString({ message: 'Organization name must be a string' })
  @ApiProperty({ example: 'Abc Tech' })
  @Length(5, 30, { message: 'Organization name must be between 5 and 30 characters' })
  @Sanitize()
  organizationName: string;

  @IsDefined({ message: 'User name is required' })
  @IsString({ message: 'User name must be a string' })
  @ApiProperty({ example: 'navaneethan' })
  @Length(3, 30, { message: 'User name must be between 3 and 30 characters' })
  @Sanitize()
  userName: string;

  @IsDefined({ message: 'Email is required' })
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  @ApiProperty({ example: 'navaneethan@conversedatasolutions.com' })
  @Length(5, 50, { message: 'Email must be between 5 and 50 characters' })
  @Sanitize()
  email: string;

  @IsDefined({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9\- ]{7,20}$/, {
    message: 'Phone must be a valid number and may include country code',
  })
  @ApiProperty({ example: '9876532458' })
  @Length(5, 20, { message: 'Phone must be between 6 and 20 characters' })
  @Sanitize()
  phone: string;

  @IsDefined({ message: 'Password is required' })
  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @Length(7, 15, { message: 'Password must be between 7 and 15 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,15}$/, {
    message:
      'Password must be 7-15 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @Sanitize()
  password: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL must be a string' })
  @ApiPropertyOptional({ example: 'http://www.abctech.in' })
  @Sanitize()
  url?: string;

  @IsOptional()
  @IsString({ message: 'Please provide a valid address' })
  @ApiPropertyOptional({ example: '11/2 Abc street' })
  @Sanitize()
  address?: string;

  @IsOptional()
  @IsString({ message: 'City should be string' })
  @ApiPropertyOptional({ example: 'Gobi' })
  @Sanitize()
  city?: string;

  @IsOptional()
  @IsString({ message: 'Country should be string' })
  @ApiPropertyOptional({ example: 'India' })
  @Sanitize()
  country?: string;
}
