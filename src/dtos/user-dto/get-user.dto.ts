import { ApiPropertyOptional, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Role } from 'src/enums/core-app.enum';
import { StatusCause } from 'src/enums/status.enum';
import { UserSignupDto } from './user-signup.dto';
import { PageDto } from '../page-dto/page.dto';

export class GetUserDto extends IntersectionType(
  PartialType(OmitType(UserSignupDto, ['address', 'password'] as const)),
  PageDto,
) {
  @ApiPropertyOptional({ description: 'Status of the user' })
  @IsOptional()
  @IsString()
  status?: boolean;

  @ApiPropertyOptional({ description: 'Status cause of the user' })
  @IsOptional()
  @IsEnum(StatusCause)
  statusCause?: StatusCause;

  @ApiPropertyOptional({ description: 'Role of the user' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
