import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Account } from 'src/database/entities/core-app-entities/account.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { CreateAccountDto } from 'src/dtos/account-dto/create-account.dto';
import { GetAccountDto } from 'src/dtos/account-dto/get-account.dto';
import { UpdateAccountDto } from 'src/dtos/account-dto/update-account.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { CountryService } from './country.service';

@Injectable()
export class AccountService {
  constructor(private readonly countryService: CountryService) {}
  async create(
    tenantId: string,
    user: User,
    createAccountDto: CreateAccountDto,
  ): Promise<APIResponse> {
    const accountRepo = await getRepo<Account>(Account, tenantId);
    const accountExist = await accountRepo.findOne({ where: { name: createAccountDto.name } });

    if (accountExist) {
      throw new BadRequestException({ message: 'Account already registered' });
    }
    const { country, ...createAccount } = createAccountDto;
    let accountCountry: string | undefined;
    if (country) {
      accountCountry = this.countryService.getCountry(country);
    }
    await accountRepo.save({
      ...createAccount,
      country: accountCountry,
      createdBy: user,
    });
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Account created successfully',
    };
  }

  async findAll(tenantId: string, accountQuery: GetAccountDto): Promise<APIResponse<Account[]>> {
    const accountRepo = await getRepo<Account>(Account, tenantId);
    const qb = accountRepo.createQueryBuilder('account');

    const page = Math.max(1, Number(accountQuery.page ?? 1));
    const defaultLimit = Number(accountQuery.limit ?? 10);
    const limit =
      Number.isFinite(defaultLimit) && defaultLimit > 0
        ? Math.min(100, Math.floor(defaultLimit))
        : 10;
    const skip = (page - 1) * limit;

    for (const [key, value] of Object.entries(accountQuery)) {
      if (value == null || key === 'page' || key === 'limit') {
        continue;
      } else if (['name', 'industry', 'city', 'country'].includes(key)) {
        qb.andWhere(`account.${key} LIKE :${key}`, { [key]: `%${value}%` });
      }
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Account details fetched based on filter',
      data,
      pageInfo: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    tenantId: string,
    id: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<APIResponse> {
    const accountRepo = await getRepo<Account>(Account, tenantId);

    const account = await accountRepo.findOne({ where: { id } });
    if (!account) {
      throw new BadRequestException({ message: 'Invalid account id' });
    }
    const { country, ...updateAccount } = updateAccountDto;
    let accountCountry: string | undefined;
    if (country) {
      accountCountry = this.countryService.getCountry(country);
    }
    account.country = accountCountry;
    await accountRepo.save({ ...account, ...updateAccount });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Account details updated successfully',
    };
  }
}
