import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsString } from 'class-validator';

export class Signin {
  @IsDefined()
  @IsEmail()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'pa$$w0rd' })
  password: string;
}

export class UserSignupDto extends Signin {
  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'john' })
  name: string;
}
