import { Body, Controller, Put, Headers, Param, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { UpdateUserDto } from 'src/dtos/user-dto/update-user.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/enums/core-app.enum';
import { GetUserDto } from 'src/dtos/user-dto/get-user.dto';
import { APIResponse } from 'src/common/dtos/response.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.SalesRep)
  @ApiOperation({ summary: 'Retrive all users' })
  @ApiResponse({ status: 200, description: 'Users retrived successfully' })
  async getAllUsers(@Headers('x-tenant-id') tenantId: string, @Query() userQuery: GetUserDto) {
    return await this.userService.getAllUsers(tenantId, userQuery);
  }

  @Get('me')
  @ApiOperation({ summary: 'Retrive user data' })
  @ApiResponse({ status: 200, description: 'Retrived current user' })
  getUser(@Headers('x-tenant-id') tenantId: string, @CurrentUser() user: User): APIResponse<User> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User retrived successfully',
      data: user,
    };
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
