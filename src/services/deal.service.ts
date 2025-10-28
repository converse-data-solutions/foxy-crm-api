import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
import { MetricService } from './metric.service';
import { MetricDto } from 'src/dtos/metric-dto/metric.dto';
import { applyFilters, FiltersMap } from 'src/shared/utils/query-filter.util';

@Injectable()
export class DealService {
  constructor(private readonly metricService: MetricService) {}
  async createDeal(tenantId: string, user: User, createDealDto: CreateDealDto) {
    const dealRepo = await getRepo(Deal, tenantId);
    const contactRepo = await getRepo(Contact, tenantId);
    const { contactId, value, ...createDeal } = createDealDto;
    let dealValue = Number(value);

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      dealValue = Number(value);
      if (Number.isNaN(dealValue)) {
        throw new BadRequestException('Invalid deal value');
      }
    }
    const dealExist = await dealRepo.findOne({ where: { name: createDealDto.name } });
    if (dealExist) {
      throw new ConflictException('Deal with this name is already created');
    }
    const contact = await contactRepo.findOne({
      where: { id: contactId },
    });
    if (contactId && !contact) {
      throw new BadRequestException('Invalid contact id');
    }
    await dealRepo.save({
      ...createDeal,
      value: dealValue,
      contactId: contact ?? undefined,
      createdBy: user,
    });

    const metric: Partial<MetricDto> = { deals: 1 };
    await this.metricService.updateTenantCounts(tenantId, metric);
    return { success: true, statusCode: HttpStatus.CREATED, message: 'Deal created successfully' };
  }

  async findAllDeals(tenantId: string, dealQuery: GetDealDto, user: User) {
    const dealRepo = await getRepo<Deal>(Deal, tenantId);
    const qb = dealRepo.createQueryBuilder('deal').leftJoinAndSelect('deal.contactId', 'contact');

    const { limit, page, skip } = paginationParams(dealQuery.page, dealQuery.limit);

    const FILTERS: FiltersMap = {
      name: { column: 'deal.name', type: 'ilike' },
      maxValue: { column: 'deal.value', type: 'lte' },
      minValue: { column: 'deal.value', type: 'gte' },
      fromDate: { column: 'deal.expected_close_date', type: 'gte' },
      toDate: { column: 'deal.expected_close_date', type: 'lte' },
    };
    applyFilters(qb, FILTERS, dealQuery);

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    const pageInfo = { total, limit, page, totalPages: Math.ceil(total / limit) };
    const deals: Partial<Deal>[] = data.map(({ value, ...deal }) => deal);
    let dealData: Partial<Deal>[] = data;
    if (![Role.Admin].includes(user.role)) {
      dealData = deals;
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Deal fetched based on filter',
      data: dealData,
      pageInfo,
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
      throw new BadRequestException('Invalid deal id or deal not found');
    }
    if (updateDeal.name) {
      const dealNameExist = await dealRepo.findOne({ where: { name: updateDeal.name } });
      if (dealNameExist && dealExist.name !== updateDeal.name) {
        throw new ConflictException('Deal is already present with this name');
      }
    }
    if (dealExist.stage === DealStage.Completed && deals.stage !== DealStage.Accepted) {
      throw new BadRequestException('Cannot update a deal after it is completed');
    }

    if (updateDeal.stage === DealStage.Completed) {
      if (user.role !== Role.Admin && user.role !== Role.Manager) {
        throw new UnauthorizedException('Admin or manager only can update the deal status');
      }

      const dealTasks = await taskRepo.find({ where: { entityId: id } });
      if (dealTasks.length === 0) {
        throw new BadRequestException('Cannot complete the deal without doing task');
      }
      const hasPending = dealTasks.some((t) => t.status !== TaskStatus.Completed);
      if (hasPending) {
        throw new BadRequestException('Cannot complete the deal while there are pending tasks');
      }
    }

    if (value !== undefined && value !== null) {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) throw new BadRequestException('Invalid value');
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
