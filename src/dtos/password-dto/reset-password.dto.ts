import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, Matches, Length } from 'class-validator';
import { SignIn } from '../user-dto/user-signup.dto';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class ForgotPasswordDto extends SignIn {}

export class ResetPasswordDto extends ForgotPasswordDto {
  @IsDefined({ message: 'Password is required' })
  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @Length(7, 15, { message: 'Password must be between 7 and 15 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,15}$/, {
    message:
      'Password must be 7-15 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @Sanitize()
  newPassword: string;
}
