import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { IsDefined, IsString, Length, Matches } from 'class-validator';
import { TenantSignupDto } from '../tenant-dto/tenant-signup.dto';

export class SignIn extends PickType(TenantSignupDto, ['email', 'password'] as const) {}

export class UserSignupDto extends OmitType(TenantSignupDto, [
  'organizationName',
  'userName',
  'url',
]) {
  @IsDefined({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @Length(3, 30, { message: 'Name must be between 3 and 30 characters' })
  @ApiProperty({ example: 'john' })
  name: string;
}
