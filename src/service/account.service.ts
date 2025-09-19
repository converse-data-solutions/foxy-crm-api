import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { APIResponse } from 'src/common/dto/response.dto';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { Account } from 'src/database/entity/core-app/account.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { CreateAccountDto } from 'src/dto/account-dto/create-account.dto';
import { GetAccountDto } from 'src/dto/account-dto/get-account.dto';
import { UpdateAccountDto } from 'src/dto/account-dto/update-account.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { ILike } from 'typeorm';

@Injectable()
export class AccountService {
  async create(
    tenantId: string,
    user: User,
    createAccountDto: CreateAccountDto,
  ): Promise<APIResponse> {
    const accountRepo = await getRepo<Account>(Account, tenantId);
    const accountExist = await accountRepo.findOne({ where: { name: createAccountDto.name } });
    const countryRepo = await getRepo<Country>(Country, tenantId);

    if (accountExist) {
      throw new BadRequestException({ message: 'Account already registered' });
    }
    const { country, ...createAccount } = createAccountDto;
    let accountCountry: Country | null = null;
    if (country) {
      accountCountry = await countryRepo.findOne({ where: { name: ILike(`%${country}%`) } });
    }
    await accountRepo.save({
      ...createAccount,
      country: accountCountry ? accountCountry : undefined,
      createdBy: user,
    });
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Account created successfully',
    };
  }

  async findAll(tenantId: string, accountQuery: GetAccountDto) {
    return `This action returns all account`;
  }

  async update(
    tenantId: string,
    id: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<APIResponse> {
    const accountRepo = await getRepo<Account>(Account, tenantId);
    const countryRepo = await getRepo<Country>(Country, tenantId);

    const account = await accountRepo.findOne({ where: { id } });
    if (!account) {
      throw new BadRequestException({ message: 'Invalid account id' });
    }
    const { country, ...updateAccount } = updateAccountDto;
    let accountCountry: Country | null = null;
    if (country) {
      accountCountry = await countryRepo.findOne({ where: { name: country } });
      if (!accountCountry) {
        throw new NotFoundException({ message: 'Country not found' });
      }
    }
    accountRepo.merge(account, updateAccount);
    account.country = accountCountry ? accountCountry : undefined;
    await countryRepo.save(account);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Account details updated successfully',
    };
  }
}
