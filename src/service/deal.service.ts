import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponse } from 'src/common/dto/response.dto';
import { Contact } from 'src/database/entity/core-app/contact.entity';
import { Deal } from 'src/database/entity/core-app/deal.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { CreateDealDto } from 'src/dto/deal-dto/create-deal.dto';
import { GetDealDto } from 'src/dto/deal-dto/get-deal.dto';
import { UpdateDealDto } from 'src/dto/deal-dto/update-deal.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';

@Injectable()
export class DealService {
  async createDeal(tenantId: string, user: User, createDealDto: CreateDealDto) {
    const dealRepo = await getRepo(Deal, tenantId);
    const contactRepo = await getRepo(Contact, tenantId);
    const { contactId, value, ...createDeal } = createDealDto;
    const dealValue = Number(value);
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

    for (const [key, value] of Object.entries(dealQuery)) {
      if (value == null || key === 'page' || key === 'limit') {
        continue;
      } else if (key === 'name') {
        qb.andWhere('deal.name ILIKE :name', { name: `%${dealQuery.name}%` });
      } else if (key === 'greaterValue') {
        qb.andWhere('deal.value >=:greaterValue', { greaterValue: dealQuery.greaterValue });
      } else if (key === 'lesserValue') {
        qb.andWhere('deal.value <=:lesserValue', { lesserValue: dealQuery.lesserValue });
      } else if (key === 'fromDate') {
        qb.andWhere('deal.expected_close_date >=:fromDate ', { fromDate: dealQuery.fromDate });
      } else if (key === 'toDate') {
        qb.andWhere('deal.expected_close_date <=:toDate ', { toDate: dealQuery.toDate });
      }
    }

    const page = dealQuery.page ?? 1;
    const limit = dealQuery.limit ?? 10;
    const skip = (page - 1) * limit;

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
    const dealExist = await dealRepo.findOne({ where: { id } });
    const { value, ...deals } = updateDeal;
    if (!dealExist) {
      throw new BadRequestException({ message: 'Invalid deal id or deal not found' });
    }
    dealExist.value = value ? Number(value) : dealExist.value;
    dealRepo.merge(dealExist, deals);
    await dealRepo.save(dealExist);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Deal info updated successfully',
    };
  }
}
