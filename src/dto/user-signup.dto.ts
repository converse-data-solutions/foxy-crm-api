import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString, Matches } from 'class-validator';

export class Signin {
  @IsDefined({ message: 'Email is required' })
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @IsDefined({ message: 'Password must be required' })
  @IsString({ message: 'Please give password in correct format' })
  @ApiProperty({ example: 'pa$$w0rd' })
  password: string;
}

export class UserSignupDto extends Signin {
  @IsDefined({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @ApiProperty({ example: 'john' })
  name: string;

  @IsDefined({ message: 'Phone number is required' })
  @Matches(/^\+?[0-9\- ]{7,20}$/, {
    message: 'Phone must be a valid number and may include country code',
  })
  @ApiProperty({ example: '9876532458' })
  phone: string;

  @IsOptional()
  @IsString({ message: 'Country should be string' })
  @ApiProperty({ example: 'India' })
  country?: string;
}
