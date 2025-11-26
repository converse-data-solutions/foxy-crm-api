import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailService } from './email.service';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { Task } from 'src/database/entities/core-app-entities/task.entity';
import { Deal } from 'src/database/entities/core-app-entities/deal.entity';
import { Ticket } from 'src/database/entities/core-app-entities/ticket.entity';
import { Role, EntityName, TaskPriority } from 'src/enums/core-app.enum';
import { DealStage, TicketStatus } from 'src/enums/status.enum';
import { CreateTaskDto } from 'src/dtos/task-dto/create-task.dto';
import { UpdateTaskDto } from 'src/dtos/task-dto/update-task.dto';
import { taskAssignmentTemplate } from 'src/templates/task-assignment.template';

jest.mock('src/shared/database-connection/get-connection');
jest.mock('src/templates/task-assignment.template', () => ({
  taskAssignmentTemplate: jest.fn().mockReturnValue('<p>Task Assigned</p>'),
}));

describe('TaskService', () => {
  let service: TaskService;
  let mockEventEmitter: EventEmitter2;
  let mockEmailService: EmailService;

  const mockTaskRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    merge: jest.fn(),
  };
  const mockUserRepo = { findOne: jest.fn() };
  const mockDealRepo = { findOne: jest.fn() };
  const mockTicketRepo = { findOne: jest.fn() };
  let mockSubscriptionRepo = { findOne: jest.fn() };
  let mockPlanRepo = { findOne: jest.fn() };
  const mockTenantId = 'tenant123';
  const mockUser = {
    name: 'user',
    email: 'user@mail.com',
    password: 'hashedPassword',
    id: 'user01',
    role: Role.Admin,
  } as User;

  const mockTask = {
    name: 'Follow-up Call',
    entityName: 'Lead',
    priority: TaskPriority.High,
    assignedTo: { id: 1 },
  };

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (getRepo as jest.Mock).mockImplementation(async (entity) => {
      if (entity === Task) return mockTaskRepo;
      if (entity === User) return mockUserRepo;
      if (entity === Deal) return mockDealRepo;
      if (entity === Ticket) return mockTicketRepo;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        EventEmitter2,
        { provide: EmailService, useValue: { sendMail: jest.fn() } },
        { provide: 'SubscriptionRepository', useValue: { findOne: jest.fn() } },
        { provide: 'PlanRepository', useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    mockEmailService = module.get<EmailService>(EmailService);
    mockSubscriptionRepo = module.get('SubscriptionRepository');
    mockPlanRepo = module.get('PlanRepository');
    mockEventEmitter = module.get<EventEmitter2>(EventEmitter2);
    mockEmailService = module.get<EmailService>(EmailService);

    jest.spyOn(mockEventEmitter, 'emitAsync').mockResolvedValueOnce([]);
    mockTaskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('createTask', () => {
    const mockDeal = {
      id: 'deal001',
      stage: DealStage.Completed,
    };
    const mockTicket = {
      id: 'ticket001',
      status: TicketStatus.Closed,
    };
    const taskDto = {
      name: 'newTask',
      entityName: 'deals',
      entityId: 'entity1',
      assignedTo: 'user001',
    } as CreateTaskDto;

    it('should throw BadRequestException if user id is invalid', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.createTask(mockTenantId, mockUser, taskDto)).rejects.toThrow(
        'The assigned user ID is invalid.',
      );
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: taskDto.assignedTo } });
    });

    it('should throw BadRequestException if deal id is invalid', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockDealRepo.findOne.mockResolvedValue(null);
      await expect(service.createTask(mockTenantId, mockUser, taskDto)).rejects.toThrow(
        'Invalid entity id or id not found in deal entity',
      );
      expect(mockDealRepo.findOne).toHaveBeenCalledWith({
        where: { id: taskDto.entityId },
      });
    });

    it('should throw BadRequestException if task created for completed deal', async () => {
      mockDealRepo.findOne.mockResolvedValue(mockDeal);
      await expect(service.createTask(mockTenantId, mockUser, taskDto)).rejects.toThrow(
        'Cannot create a task for a completed deal.',
      );
    });

    it('should throw BadRequestException try to create task for unaccepted deal', async () => {
      mockDeal.stage = DealStage.Qualified;
      mockDealRepo.findOne.mockResolvedValue(mockDeal);
      await expect(service.createTask(mockTenantId, mockUser, taskDto)).rejects.toThrow(
        'Deal not accepted unable to create task',
      );
    });

    it('should throw BadRequestException if entity id is invalid', async () => {
      taskDto.entityName = EntityName.Ticket;
      mockTicketRepo.findOne.mockResolvedValue(null);
      await expect(service.createTask(mockTenantId, mockUser, taskDto)).rejects.toThrow(
        'Invalid entity id or id not found in ticket entity',
      );
      expect(mockTicketRepo.findOne).toHaveBeenCalledWith({ where: { id: taskDto.entityId } });
    });

    it('should throw BadRequestException if try to create task for closed ticket', async () => {
      mockTicketRepo.findOne.mockResolvedValue(mockTicket);
      await expect(service.createTask(mockTenantId, mockUser, taskDto)).rejects.toThrow(
        'Cannot create task on closed ticket',
      );
    });

    it('should throw ConflictException when task is already present', async () => {
      mockTicketRepo.findOne.mockResolvedValue({ ...mockTicket, status: TicketStatus.InProgress });
      const task = { id: 'task001' } as Task;
      mockTaskRepo.findOne.mockResolvedValue(task);
      await expect(service.createTask(mockTenantId, mockUser, taskDto)).rejects.toThrow(
        'Task with this name is already exists',
      );
      expect(mockTaskRepo.findOne).toHaveBeenCalledWith({
        where: { name: taskDto.name, entityId: taskDto.entityId },
      });
    });

    it('should create a task successfully', async () => {
      mockTaskRepo.findOne.mockResolvedValue(null);
      mockTaskRepo.save.mockResolvedValueOnce({ id: 'task01', title: 'Test task' });
      const dto = { title: 'Test task', assignedTo: 'user01' };
      const result = await service.createTask(mockTenantId, mockUser, taskDto);
      expect(mockTaskRepo.save).toHaveBeenCalled();
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith('task-created', expect.any(Object));
      expect(result).toEqual({
        success: true,
        statusCode: 201,
        message: 'Task created successfully ',
      });
    });
  });

  describe('findAllTasks', () => {
    it('should return all tasks for admin with pagination', async () => {
      const mockTasks = [{ id: 't01', name: 'Task 1' }];
      const mockQuery = { page: 1, limit: 10 };
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([mockTasks, 1]);
      const result = await service.findAllTasks(mockTenantId, mockUser, mockQuery);
      expect(getRepo).toHaveBeenCalledWith(Task, mockTenantId);
      expect(mockTaskRepo.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('task.assignedTo', 'user');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          data: mockTasks,
          message: 'Task details fetched based on filter',
        }),
      );
    });

    it('should apply assignedTo filter for admin when provided', async () => {
      const mockTenantId = 'tenant123';
      const mockQuery = {
        page: 1,
        limit: 10,
        sortBy: '',
        sortDirection: 'ASC',
        assignedTo: 'John',
        name: '',
      };
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([[], 0]);
      await service.findAllTasks(mockTenantId, mockUser, mockQuery);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(`user.name ILIKE :assignedTo`, {
        assignedTo: '%John%',
      });
    });

    it('should restrict results to user.id when not Admin or Manager', async () => {
      mockUser.role = Role.SalesRep;
      const mockQuery = { page: 1, limit: 5 };
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([[], 0]);
      await service.findAllTasks(mockTenantId, mockUser, mockQuery);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.id =:id', { id: mockUser.id });
    });
  });

  describe('updateTask', () => {
    const taskId = 'invalid';
    const mockTask = { id: 't01', name: 'Task 1', assignedTo: {} };

    it('should throw BadRequestException when task not found', async () => {
      mockTaskRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.updateTask(mockTenantId, mockUser, taskId, {})).rejects.toThrow(
        'The specified task ID is invalid or the task does not exist.',
      );
    });

    it('should throw UnauthorizedException if non-admin updates task fields', async () => {
      mockTaskRepo.findOne.mockResolvedValueOnce(mockTask);
      const updateTaskDto = { name: 'Changed Task' } as UpdateTaskDto;
      await expect(
        service.updateTask(mockTenantId, mockUser, mockTask.id, updateTaskDto),
      ).rejects.toThrow('Not authorized to update task details');
    });

    it('should throw UnauthorizedException if non-admin reassigns task', async () => {
      mockTaskRepo.findOne.mockResolvedValueOnce(mockTask);
      mockUser.role = Role.SalesRep;
      const updateTaskDto = { assignedTo: 'u03' };
      await expect(
        service.updateTask(mockTenantId, mockUser, 't01', updateTaskDto),
      ).rejects.toThrow('Not authorized to update task details');
    });

    it('should throw BadRequestException if assignedTo user not found', async () => {
      mockUser.role = Role.Admin;
      mockTaskRepo.findOne.mockResolvedValueOnce(mockTask);
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      const updateTaskDto = { assignedTo: 'u99' };
      await expect(
        service.updateTask(mockTenantId, mockUser, mockTask.id, updateTaskDto),
      ).rejects.toThrow('Not assign to invalid user');
    });

    it('should retain existing status if no status provided in updateTaskDto', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      const mockTask = {
        id: 'task01',
        name: 'Old Task',
        status: 'Open',
        assignedTo: { id: 'userA' },
      };
      const assignedToUser = { id: 'user01', name: 'user' };
      const updateTaskDto = { assignedTo: 'user01' };
      mockTaskRepo.findOne.mockResolvedValueOnce(mockTask);
      mockTaskRepo.save.mockResolvedValueOnce({
        ...mockTask,
        assignedTo: assignedToUser,
        status: 'Open',
      });
      mockTaskRepo.merge.mockImplementation((task, updates) => ({ ...task, ...updates }));
      const result = await service.updateTask(mockTenantId, mockUser, 'task01', updateTaskDto);
      expect(mockTaskRepo.merge).toHaveBeenCalledWith(mockTask, {});
      expect(mockTaskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockTask,
          assignedTo: expect.objectContaining({
            id: 'user01',
            name: 'user',
          }),
          status: 'Open',
        }),
      );
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'Task details updated successfully',
      });
    });
  });

  describe('taskMailer', () => {
    it('should send mail for Enterprise plan user', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue({
        planPrice: { id: 10 },
        tenant: { schemaName: 'tenant1' },
      });
      mockPlanRepo.findOne.mockResolvedValue({ planName: 'Enterprise' });
      mockUserRepo.findOne.mockResolvedValue({ id: 1, name: 'User', email: 'john@test.com' });
      await service.taskMailer('tenant1', mockTask as any);
      expect(taskAssignmentTemplate).toHaveBeenCalledWith(
        'User',
        'Follow-up Call',
        'Lead',
        TaskPriority.High,
      );
      expect(mockEmailService.sendMail).toHaveBeenCalledWith({
        to: 'john@test.com',
        html: '<p>Task Assigned</p>',
        subject: 'New Task "Follow-up Call" Assigned to You',
      });
    });

    it('should send mail for High priority task on non-Enterprise plan', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue({
        planPrice: { id: 11 },
        tenant: { schemaName: 'tenant1' },
      });
      mockPlanRepo.findOne.mockResolvedValue({ planName: 'Basic' });
      mockUserRepo.findOne.mockResolvedValue({ id: 1, name: 'John', email: 'john@test.com' });
      await service.taskMailer('tenant1', mockTask as any);
      expect(taskAssignmentTemplate).toHaveBeenCalled();
      expect(mockEmailService.sendMail).toHaveBeenCalled();
    });

    it('should not send mail for non-Enterprise and low priority task', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue({
        planPrice: { id: 11 },
        tenant: { schemaName: 'tenant1' },
      });
      mockPlanRepo.findOne.mockResolvedValue({ planName: 'Basic' });
      mockUserRepo.findOne.mockResolvedValue({ id: 1, name: 'John', email: 'john@test.com' });
      await service.taskMailer('tenant1', {
        ...mockTask,
        priority: TaskPriority.Low,
      } as any);
      expect(mockEmailService.sendMail).not.toHaveBeenCalled();
    });

    it('should not send mail if subscription or user is missing', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValue(null);
      mockUserRepo.findOne.mockResolvedValue({ id: 1, name: 'John', email: 'john@test.com' });
      await service.taskMailer('tenant1', mockTask as any);
      expect(mockEmailService.sendMail).not.toHaveBeenCalled();
    });
  });
});
