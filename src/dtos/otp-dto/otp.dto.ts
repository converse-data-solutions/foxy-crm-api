import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDefined, IsInt, Max, Min } from 'class-validator';
import { SignIn } from '../user-dto/user-signup.dto';

export class EmailDto extends OmitType(SignIn, ['password']) {}

export class OtpDto extends EmailDto {
  @IsDefined({ message: 'Otp is required' })
  @ApiProperty({ example: '784567' })
  @IsInt()
  @Min(100000, { message: 'OTP must be 6 digits' })
  @Max(999999, { message: 'OTP must be 6 digits' })
  otp: number;
}
