import { BadRequestException, ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Account } from 'src/database/entities/core-app-entities/account.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { CreateAccountDto } from 'src/dtos/account-dto/create-account.dto';
import { GetAccountDto } from 'src/dtos/account-dto/get-account.dto';
import { UpdateAccountDto } from 'src/dtos/account-dto/update-account.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { CountryService } from './country.service';
import { paginationParams } from 'src/shared/utils/pagination-params.util';

@Injectable()
export class AccountService {
  constructor(private readonly countryService: CountryService) {}
  async create(
    tenantId: string,
    user: User,
    createAccountDto: CreateAccountDto,
  ): Promise<APIResponse> {
    const accountRepo = await getRepo<Account>(Account, tenantId);
    const accountExist = await accountRepo.findOne({
      where: [{ name: createAccountDto.name }, { website: createAccountDto.website }],
    });

    if (accountExist) {
      throw new ConflictException('Account with this websitye or name is already present');
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

    const { limit, page, skip } = paginationParams(accountQuery.page, accountQuery.limit);
    for (const [key, value] of Object.entries(accountQuery)) {
      if (value == null || key === 'page' || key === 'limit') {
        continue;
      } else if (['name', 'industry', 'city', 'country'].includes(key)) {
        qb.andWhere(`account.${key} LIKE :${key}`, { [key]: `%${value}%` });
      }
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    const pageInfo = { total, limit, page, totalPages: Math.ceil(total / limit) };
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Account details fetched based on filter',
      data,
      pageInfo,
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
      throw new BadRequestException('Invalid account id');
    }
    const { country, ...updateAccount } = updateAccountDto;
    let accountCountry: string | undefined;
    if (country) {
      accountCountry = this.countryService.getCountry(country);
    }
    if (updateAccount.name || updateAccount.website) {
      const accounts = await accountRepo.find({
        where: [{ name: updateAccount.name }, { website: updateAccount.website }],
      });
      if (accounts.length > 0) {
        throw new ConflictException('The account with this name or website is already present');
      }
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
