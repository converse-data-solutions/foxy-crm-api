import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Subscription } from 'src/database/entities/base-app-entities/subscription.entity';
import { Deal } from 'src/database/entities/core-app-entities/deal.entity';
import { Task } from 'src/database/entities/core-app-entities/task.entity';
import { Ticket } from 'src/database/entities/core-app-entities/ticket.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { CreateTaskDto } from 'src/dtos/task-dto/create-task.dto';
import { GetTaskDto } from 'src/dtos/task-dto/get-task.dto';
import { UpdateTaskDto } from 'src/dtos/task-dto/update-task.dto';
import { EntityName, Role, TaskPriority } from 'src/enums/core-app.enum';
import { DealStage, TicketStatus } from 'src/enums/status.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { taskAssignmentTemplate } from 'src/templates/task-assignment.template';
import { Repository } from 'typeorm';

@Injectable()
export class TaskService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly mailService: MailerService,
  ) {}
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
    const newTask: Task = await taskRepo.save({
      assignedTo: userExist,
      entityId,
      ...createTask,
      createdBy: user,
    });
    await this.eventEmitter.emitAsync('task-created', { tenantId, task: newTask });
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
    const updatedTask = await taskRepo.save(taskExist);
    await this.eventEmitter.emitAsync('task-updated', { tenantId, task: updatedTask });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Task details updated successfully',
    };
  }

  async taskMailer(tenantId: string, task: Task) {
    const userRepo = await getRepo(User, tenantId);
    const tenantDetails = await this.subscriptionRepo.findOne({
      where: { tenant: { schemaName: tenantId } },
      relations: { tenant: true, plan: true },
    });
    const user = await userRepo.findOne({ where: { id: task.assignedTo.id } });
    let html: null | string = null;
    if (tenantDetails && user) {
      if (tenantDetails.plan.planName === 'Platinum') {
        if (user) {
          html = taskAssignmentTemplate(user.name, task.name, task.entityName, task.priority);
        }
      } else {
        if (task.priority == TaskPriority.High) {
          html = taskAssignmentTemplate(user.name, task.name, task.entityName, task.priority);
        }
      }
      if (html) {
        await this.mailService.sendMail({
          to: user.email,
          html,
          subject: `New Task "${task.name}" Assigned to You`,
        });
      }
    }
  }
}
