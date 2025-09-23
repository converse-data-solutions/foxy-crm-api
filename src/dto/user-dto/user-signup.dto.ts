import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString, Length, Matches } from 'class-validator';

export class Signin {
  @IsDefined({ message: 'Email is required' })
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  @ApiProperty({ example: 'john@example.com' })
  @Length(5, 50, { message: 'Email must be between 5 and 50 characters' })
  email: string;

  @IsDefined({ message: 'Password must be required' })
  @IsString({ message: 'Please give password in correct format' })
  @Length(7, 15, { message: 'Password must be between 7 and 15 characters' })
  @ApiProperty({ example: 'pa$w0rd$' })
  password: string;
}

export class UserSignupDto extends Signin {
  @IsDefined({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @Length(2, 30, { message: 'Name must be between 2 and 30 characters' })
  @ApiProperty({ example: 'john' })
  name: string;

  @IsDefined({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9\- ]{7,20}$/, {
    message: 'Phone must be a valid number and may include country code',
  })
  @Length(6, 20, { message: 'Phone number must be between 6 and 20 characters' })
  @ApiProperty({ example: '9876532458' })
  phone: string;

  @IsOptional()
  @IsString({ message: 'Country should be string' })
  @ApiProperty({ example: 'India' })
  country?: string;
}
