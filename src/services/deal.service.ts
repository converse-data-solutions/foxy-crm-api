import { BadRequestException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Contact } from 'src/database/entities/core-app-entities/contact.entity';
import { Deal } from 'src/database/entities/core-app-entities/deal.entity';
import { Task } from 'src/database/entities/core-app-entities/task.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { CreateDealDto } from 'src/dtos/deal-dto/create-deal.dto';
import { GetDealDto } from 'src/dtos/deal-dto/get-deal.dto';
import { UpdateDealDto } from 'src/dtos/deal-dto/update-deal.dto';
import { Role } from 'src/enums/core-app.enum';
import { DealStage, TaskStatus } from 'src/enums/status.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { paginationParams } from 'src/shared/utils/pagination-params.util';

@Injectable()
export class DealService {
  async createDeal(tenantId: string, user: User, createDealDto: CreateDealDto) {
    const dealRepo = await getRepo(Deal, tenantId);
    const contactRepo = await getRepo(Contact, tenantId);
    const { contactId, value, ...createDeal } = createDealDto;
    let dealValue = Number(value);

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      dealValue = Number(value);
      if (Number.isNaN(dealValue)) {
        throw new BadRequestException({ message: 'Invalid deal value' });
      }
    }

    const contact = await contactRepo.findOne({
      where: { id: contactId },
    });
    if (contactId && !contact) {
      throw new BadRequestException({ message: 'Invalid contact id' });
    }
    await dealRepo.save({
      ...createDeal,
      value: dealValue,
      contactId: contact ? contact : undefined,
      createdBy: user,
    });
    return { success: true, statusCode: HttpStatus.CREATED, message: 'Deal created successfully' };
  }

  async findAllDeals(tenantId: string, dealQuery: GetDealDto) {
    const dealRepo = await getRepo<Deal>(Deal, tenantId);
    const qb = dealRepo.createQueryBuilder('deal');

    const { limit, page, skip } = paginationParams(dealQuery.page, dealQuery.limit);

    for (const [key, value] of Object.entries(dealQuery)) {
      if (value == null || key === 'page' || key === 'limit') continue;
      if (key === 'name') qb.andWhere('deal.name ILIKE :name', { name: `%${String(value)}%` });
      else if (key === 'greaterValue') {
        const nv = Number(value);
        if (!Number.isNaN(nv)) qb.andWhere('deal.value >= :greaterValue', { greaterValue: nv });
      } else if (key === 'lesserValue') {
        const nv = Number(value);
        if (!Number.isNaN(nv)) qb.andWhere('deal.value <= :lesserValue', { lesserValue: nv });
      } else if (key === 'fromDate') {
        const d = new Date(String(value));
        if (!Number.isNaN(d.getTime()))
          qb.andWhere('deal.expected_close_date >= :fromDate', { fromDate: d.toISOString() });
      } else if (key === 'toDate') {
        const d = new Date(String(value));
        if (!Number.isNaN(d.getTime()))
          qb.andWhere('deal.expected_close_date <= :toDate', { toDate: d.toISOString() });
      }
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Deal fetched based on filter',
      data,
      pageInfo: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateDeal(
    tenantId: string,
    user: User,
    id: string,
    updateDeal: UpdateDealDto,
  ): Promise<APIResponse> {
    const dealRepo = await getRepo(Deal, tenantId);
    const taskRepo = await getRepo(Task, tenantId);
    const dealExist = await dealRepo.findOne({ where: { id } });
    const { value, ...deals } = updateDeal;
    if (!dealExist) {
      throw new BadRequestException({ message: 'Invalid deal id or deal not found' });
    }

    if (updateDeal.stage === DealStage.Completed) {
      if (user.role !== Role.Admin && user.role !== Role.Manager) {
        throw new UnauthorizedException({
          message: 'Admin or manager only can update the deal status',
        });
      }

      const dealTasks = await taskRepo.find({ where: { entityId: id } });
      if (dealTasks.length === 0) {
        throw new BadRequestException({ message: 'Cannot complete the deal without doing task' });
      }
      const hasPending = dealTasks.some((t) => t.status !== TaskStatus.Completed);
      if (hasPending) {
        throw new BadRequestException({
          message: 'Cannot complete the deal while there are pending tasks',
        });
      }
    }

    if (value !== undefined && value !== null) {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) throw new BadRequestException({ message: 'Invalid value' });
      dealExist.value = numeric;
    }

    dealRepo.merge(dealExist, deals);
    await dealRepo.save(dealExist);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Deal info updated successfully',
    };
  }
}
