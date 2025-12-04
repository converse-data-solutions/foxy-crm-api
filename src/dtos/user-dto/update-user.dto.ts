import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/enums/core-app.enum';
import { UserSignupDto } from './user-signup.dto';
import { Sanitize } from 'src/common/decorators/sanitize.decorator';

export class UpdateUserDto extends PartialType(OmitType(UserSignupDto, ['password'])) {
  @ApiPropertyOptional({
    enum: Role,
    description: 'Role of the user',
    example: Role.SalesRep,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'role must be a valid enum value' })
  role?: Role;
}
