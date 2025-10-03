import { Controller, Get, Post, Body, Param, Headers, Put, Query } from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { UpdateTaskDto } from 'src/dtos/task-dto/update-task.dto';
import { CreateTaskDto } from 'src/dtos/task-dto/create-task.dto';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/role.decorator';
import { Role } from 'src/enums/core-app.enum';
import { GetTaskDto } from 'src/dtos/task-dto/get-task.dto';

@Roles(Role.Admin, Role.Manager)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create and assign task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async createTask(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return await this.taskService.createTask(tenantId, user, createTaskDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Manager, Role.Support, Role.SalesRep)
  @ApiOperation({ summary: 'Retrive task details' })
  @ApiResponse({ status: 200, description: 'Task fetched successfully' })
  async findAllTasks(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Query() taskQuery: GetTaskDto,
  ) {
    return await this.taskService.findAllTasks(tenantId, user, taskQuery);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Manager, Role.Support, Role.SalesRep)
  @ApiOperation({ summary: 'Update task details' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  async updateTask(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: User,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return await this.taskService.updateTask(tenantId, user, id, updateTaskDto);
  }
}
