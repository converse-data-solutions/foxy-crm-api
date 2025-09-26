import { BadRequestException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { APIResponse } from 'src/common/dto/response.dto';
import { Deal } from 'src/database/entity/core-app/deal.entity';
import { Task } from 'src/database/entity/core-app/task.entity';
import { Ticket } from 'src/database/entity/core-app/ticket.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { CreateTaskDto } from 'src/dto/task-dto/create-task.dto';
import { GetTaskDto } from 'src/dto/task-dto/get-task.dto';
import { UpdateTaskDto } from 'src/dto/task-dto/update-task.dto';
import { EntityName, Role } from 'src/enum/core-app.enum';
import { DealStage, TicketStatus } from 'src/enum/status.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';

@Injectable()
export class TaskService {
  async createTask(
    tenantId: string,
    user: User,
    createTaskDto: CreateTaskDto,
  ): Promise<APIResponse> {
    const taskRepo = await getRepo(Task, tenantId);
    const userRepo = await getRepo(User, tenantId);
    const dealRepo = await getRepo(Deal, tenantId);
    const ticketRepo = await getRepo(Ticket, tenantId);
    const { assignedTo, entityId, ...createTask } = createTaskDto;

    const userExist = await userRepo.findOne({ where: { id: assignedTo } });
    if (!userExist) {
      throw new BadRequestException({ message: 'Invalid user id' });
    }
    if (createTaskDto.entityName == EntityName.Deal) {
      const dealExist = await dealRepo.findOne({ where: { id: entityId } });
      if (!dealExist) {
        throw new BadRequestException({
          message: 'Invalid entity id or id not found in deal entity',
        });
      } else if (dealExist.stage != DealStage.Accepted) {
        throw new BadRequestException({ message: 'Deal not accepted unable to create task' });
      }
    } else {
      const ticketExist = await ticketRepo.findOne({ where: { id: entityId } });
      if (!ticketExist) {
        throw new BadRequestException({
          message: 'Invalid entity id or id not found in ticket entity',
        });
      } else if (ticketExist.status == TicketStatus.Closed) {
        throw new BadRequestException({ message: 'Cannot create task on closed ticket' });
      }
    }
    await taskRepo.save({
      assignedTo: userExist,
      entityId,
      ...createTask,
      createdBy: user,
    });
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Task created successfully ',
    };
  }

  async findAllTasks(tenantId: string, user: User, taskQuery: GetTaskDto) {
    const taskRepo = await getRepo(Task, tenantId);
    const qb = taskRepo.createQueryBuilder('task').leftJoin('task.assignedTo', 'user');
    for (const [key, value] of Object.entries(taskQuery)) {
      if (value == null || key === 'page' || key === 'limit') {
        continue;
      } else if (['entityName', 'entityId', 'type', 'status', 'priority'].includes(key)) {
        qb.andWhere(`task.${key} =:${key}`, { [key]: value });
      } else if (key === 'name') {
        qb.andWhere(`task.name ILIKE :name`, { name: `%${value}%` });
      }
    }
    if (![Role.Admin, Role.Manager].includes(user.role)) {
      qb.andWhere(`user.id =:id`, { id: user.id });
    } else {
      if (taskQuery.assignedTo) {
        qb.andWhere(`user.name ILIKE :assignedTo`, { assignedTo: `%${taskQuery.assignedTo}%` });
      }
    }
    const page = taskQuery.page ?? 1;
    const limit = taskQuery.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Task details fetched based on filter',
      data,
      pageInfo: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTask(
    tenantId: string,
    user: User,
    id: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<APIResponse> {
    const taskRepo = await getRepo(Task, tenantId);
    const userRepo = await getRepo(User, tenantId);
    const taskExist = await taskRepo.findOne({ where: { id }, relations: { assignedTo: true } });
    const { status, assignedTo, ...updateTask } = updateTaskDto;
    if (!taskExist) {
      throw new BadRequestException({ message: 'Invalid task id or task not exist' });
    }
    if (status) {
      if (user.id !== taskExist.assignedTo.id && ![Role.Admin, Role.Manager].includes(user.role)) {
        throw new UnauthorizedException({ message: 'Not authorized to update task details' });
      }
      taskExist.status = status;
    }
    for (const [key, value] of Object.entries(updateTask)) {
      if (value && ![Role.Admin, Role.Manager].includes(user.role)) {
        throw new UnauthorizedException({ message: 'Not authorized to update task details' });
      }
    }
    taskRepo.merge(taskExist, updateTask);
    if (assignedTo) {
      if (![Role.Admin, Role.Manager].includes(user.role)) {
        throw new UnauthorizedException({ message: 'Not authorized to update task details' });
      }
      const existUser = await userRepo.findOne({ where: { id: assignedTo } });
      if (!existUser) {
        throw new BadRequestException({ message: 'Not assign to invalid user' });
      }
      taskExist.assignedTo = existUser;
    }
    await taskRepo.save(taskExist);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Task details updated successfully',
    };
  }
}
