import { Body, Controller, Put, Headers, Param, Get, Query } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { User } from 'src/database/entity/core-app/user.entity';
import { UpdateUserDto } from 'src/dto/user-dto/update-user.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from 'src/enum/core-app.enum';
import { GetUserDto } from 'src/dto/user-dto/get-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  @ApiOperation({ summary: 'Retrive user data' })
  @ApiResponse({ status: 200, description: 'Users retrived successfully' })
  async findAllUsers(@Headers('x-tenant-id') tenantId: string, @Query() userQuery: GetUserDto) {
    return await this.userService.getUser(tenantId, userQuery);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Update user data' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateUser: UpdateUserDto,
  ) {
    return await this.userService.updateUser(tenantId, user, id, updateUser);
  }
}
