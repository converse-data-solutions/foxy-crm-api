import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, Matches, Length, IsInt, Max, Min } from 'class-validator';

export class EmailDto {
  @IsDefined({ message: 'Email is required' })
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  @ApiProperty({ example: 'john@example.com' })
  @Length(5, 50, { message: 'Email must be between 5 and 50 characters' })
  email: string;
}

export class OtpDto extends EmailDto {
  @IsDefined({ message: 'Otp is required' })
  @ApiProperty({ example: '784567' })
  @IsInt()
  @Min(100000, { message: 'OTP must be 6 digits' })
  @Max(999999, { message: 'OTP must be 6 digits' })
  otp: number;
}
