import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Account } from 'src/database/entities/core-app-entities/account.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { CreateAccountDto } from 'src/dtos/account-dto/create-account.dto';
import { GetAccountDto } from 'src/dtos/account-dto/get-account.dto';
import { UpdateAccountDto } from 'src/dtos/account-dto/update-account.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { CountryService } from './country.service';
import { paginationParams } from 'src/shared/utils/pagination-params.util';
import { applyFilters, FiltersMap } from 'src/shared/utils/query-filter.util';
import { Role } from 'src/enums/core-app.enum';

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
      throw new ConflictException('Account with this name or website already exists.');
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
    const FILTERS: FiltersMap = {
      name: { column: 'account.name', type: 'ilike' },
      industry: { column: 'account.industry', type: 'ilike' },
      city: { column: 'account.city', type: 'ilike' },
      country: { column: 'account.country', type: 'ilike' },
    };
    applyFilters(qb, FILTERS, accountQuery);

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    const pageInfo = { total, limit, page, totalPages: Math.ceil(total / limit) };
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Account list fetched successfully.',
      data,
      pageInfo,
    };
  }

  async update(
    tenantId: string,
    id: string,
    updateAccountDto: UpdateAccountDto,
    user: User,
  ): Promise<APIResponse> {
    const accountRepo = await getRepo<Account>(Account, tenantId);

    const account = await accountRepo.findOne({ where: { id } });
    if (!account) {
      throw new BadRequestException('Invalid account ID');
    }

    if (
      user &&
      account.createdBy?.id !== user.id &&
      user.role !== Role.Admin &&
      user.role !== Role.SuperAdmin
    ) {
      throw new ForbiddenException('You do not have permission to update this account.');
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
        throw new ConflictException('Another account with this name or website is already exists.');
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
