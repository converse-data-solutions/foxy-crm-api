import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, Matches, Length } from 'class-validator';

export class ForgotPasswordDto {
  @IsDefined({ message: 'Email is required' })
  @Matches(/^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email address',
  })
  @ApiProperty({ example: 'navaneethan@conversedatasolutions.com' })
  @Length(5, 50, { message: 'Email must be between 5 and 50 characters' })
  email: string;

  @IsDefined({ message: 'Password is required' })
  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @Length(7, 15, { message: 'Password must be between 7 and 15 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,15}$/, {
    message:
      'Password must be 7-15 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;
}
export class ResetPasswordDto extends ForgotPasswordDto {
  @IsDefined({ message: 'Password is required' })
  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @Length(7, 15, { message: 'Password must be between 7 and 15 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,15}$/, {
    message:
      'Password must be 7-15 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}
