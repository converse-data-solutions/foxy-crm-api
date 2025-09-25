import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Country } from 'src/database/entity/common-entity/country.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { UpdateUserDto } from 'src/dto/user-dto/update-user.dto';
import { Role } from 'src/enum/core-app.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';
import * as bcrypt from 'bcrypt';
import { APIResponse } from 'src/common/dto/response.dto';
import { GetUserDto } from 'src/dto/user-dto/get-user.dto';

@Injectable()
export class UserService {
  async updateUser(
    tenantId: string,
    user: User,
    id: string,
    updateUser: UpdateUserDto,
  ): Promise<APIResponse> {
    const userRepo = await getRepo(User, tenantId);
    const countryRepo = await getRepo(Country, tenantId);
    const existUser = await userRepo.findOne({ where: { id } });
    if (user.id !== id && user.role != Role.Admin) {
      throw new UnauthorizedException({ message: 'Not have authorization to edit others data' });
    }
    if (updateUser.role && user.role != Role.Admin) {
      throw new UnauthorizedException({ message: 'Not have enough authorization to update role' });
    }
    if (!existUser) {
      throw new BadRequestException({ message: 'Invalid user id or user not found' });
    }

    const mailOrPhoneExist = await userRepo.find({
      where: [{ email: updateUser.email }, { phone: updateUser.phone }],
    });

    if (mailOrPhoneExist.length > 0) {
      for (const user of mailOrPhoneExist) {
        if (updateUser.email && user.email === updateUser.email && user.id !== existUser.id) {
          throw new ConflictException({ message: 'Email already in use' });
        }
        if (updateUser.phone && user.phone === updateUser.phone && user.id !== existUser.id) {
          throw new ConflictException({ message: 'Phone number already in use' });
        }
      }
    }
    const { country, password, ...userData } = updateUser;
    if (country) {
      const countryExist = await countryRepo.findOne({ where: { name: country } });
      if (!countryExist) {
        throw new NotFoundException({ message: 'Country not found or invalid country name' });
      }
      existUser.country = countryExist;
    }
    const hashedPassword = password
      ? await bcrypt.hash(password, Number(process.env.SALT))
      : undefined;
    await userRepo.save({ ...existUser, password: hashedPassword, ...userData });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User details updated successfully',
    };
  }

  async getUser(tenantId: string, userQuery: GetUserDto) {
    const userRepo = await getRepo(User, tenantId);
    const qb = userRepo.createQueryBuilder('user').leftJoin('user.country', 'country');

    for (const [key, value] of Object.entries(userQuery)) {
      if (value == null || key === 'page' || key === 'limit') {
        continue;
      } else if (['name', 'email', 'phone', 'city'].includes(key)) {
        qb.andWhere(`user.${key} LIKE :${key}`, { [key]: `%${value}%` });
      } else if (key === 'role') {
        qb.andWhere('user.role =:role', { role: userQuery.role });
      } else {
        qb.andWhere('country.name ILIKE :country', { country: `%${value}%` });
      }
    }
    const page = userQuery.page ?? 1;
    const limit = userQuery.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User details fetched based on filter',
      data,
      pageInfo: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
