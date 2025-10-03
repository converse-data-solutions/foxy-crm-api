import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { APIResponse } from 'src/common/dtos/response.dto';
import { Account } from 'src/database/entities/core-app-entities/account.entity';
import { Contact } from 'src/database/entities/core-app-entities/contact.entity';
import { Note } from 'src/database/entities/core-app-entities/note.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { CreateContactDto } from 'src/dtos/contact-dto/create-contact.dto';
import { GetContactDto } from 'src/dtos/contact-dto/get-contact.dto';
import { UpdateContactDto } from 'src/dtos/contact-dto/update-contact.dto';
import { Role } from 'src/enums/core-app.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';

@Injectable()
export class ContactService {
  async create(
    tenantId: string,
    user: User,
    createContactDto: CreateContactDto,
  ): Promise<APIResponse> {
    const contactRepo = await getRepo<Contact>(Contact, tenantId);
    const accountRepo = await getRepo<Account>(Account, tenantId);

    const contactExist = await contactRepo.findOne({
      where: [{ email: createContactDto.email }, { phone: createContactDto.phone }],
    });
    if (contactExist) {
      throw new BadRequestException({ message: 'Contact is alredy exist' });
    }
    const { account, ...contact } = createContactDto;
    let accountExist: Account | null = null;

    if (account) {
      accountExist = await accountRepo.findOne({ where: { name: account } });
      if (!accountExist) {
        throw new NotFoundException({ message: 'Account not found' });
      }
    }

    await contactRepo.save({
      ...contact,
      createdBy: user,
      accountId: accountExist ? accountExist : undefined,
    });

    return {
      success: false,
      statusCode: HttpStatus.CREATED,
      message: 'Contact created successfully',
    };
  }

  async findAll(
    tenantId: string,
    user: User,
    contactQuery: GetContactDto,
  ): Promise<APIResponse<Contact[]>> {
    const contactRepo = await getRepo<Contact>(Contact, tenantId);
    const qb = contactRepo
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.accountId', 'account')
      .leftJoinAndSelect('contact.notes', 'note');
    for (const [key, value] of Object.entries(contactQuery)) {
      if (value == null || key === 'page' || key === 'limit') {
        continue;
      } else if (['name', 'email', 'phone'].includes(key)) {
        qb.andWhere(`contact.${key} ILIKE :${key}`, { [key]: `%${value}%` });
      } else if (key === 'accountName') {
        qb.andWhere('account.name ILIKE :accountName', { accountName: `%${value}%` });
      }
    }
    const page = contactQuery.page ?? 1;
    const limit = contactQuery.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Contact details fetched based on filter',
      data,
      pageInfo: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(tenantId: string, user: User, id: string, updateContactDto: UpdateContactDto) {
    const contactRepo = await getRepo<Contact>(Contact, tenantId);
    const userRepo = await getRepo<User>(User, tenantId);
    const noteRepo = await getRepo<Note>(Note, tenantId);
    const accountRepo = await getRepo<Account>(Account, tenantId);

    let assignedUser: User | null = null;
    let accountId: Account | null = null;
    let contact = await contactRepo.findOne({ where: { id } });
    const { account, assignedTo, note, ...updateContact } = updateContactDto;
    if (!contact) {
      throw new NotFoundException({ message: 'Contact not found or invalid contact id' });
    }
    if (updateContactDto.assignedTo && user.role == Role.SalesRep) {
      throw new UnauthorizedException({
        message: 'Not have enough authorization to assign a contact',
      });
    } else {
      assignedUser = await userRepo.findOne({ where: { id: updateContactDto.assignedTo } });
      if (!assignedUser) {
        throw new BadRequestException({ message: 'Contact is not assigned to invalid id' });
      }
    }
    if (updateContactDto.account) {
      accountId = await accountRepo.findOne({ where: { name: updateContactDto.name } });
      if (!accountId) {
        throw new NotFoundException({ message: 'Account not found' });
      }
    }
    contact = {
      ...contact,
      ...updateContact,
      accountId: accountId ? accountId : undefined,
      assignedTo: assignedUser ? assignedUser : undefined,
    };
    const updatedContact = await contactRepo.save(contact);
    if (note) {
      await noteRepo.save({
        contact: updatedContact,
        content: note,
        createdBy: user,
      });
    }
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Contacts updated successfully',
    };
  }
}
