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
import { NotesEntityName } from 'src/enums/lead-activity.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { paginationParams } from 'src/shared/utils/pagination-params.util';
import { MetricService } from './metric.service';
import { MetricDto } from 'src/dtos/metric-dto/metric.dto';
import { applyFilters, FiltersMap } from 'src/shared/utils/query-filter.util';

@Injectable()
export class ContactService {
  constructor(private metricService: MetricService) {}
  async create(
    tenantId: string,
    user: User,
    createContactDto: CreateContactDto,
  ): Promise<APIResponse> {
    const contactRepo = await getRepo(Contact, tenantId);
    const accountRepo = await getRepo(Account, tenantId);
    const userRepo = await getRepo(User, tenantId);

    const contactExist = await contactRepo.findOne({
      where: [{ email: createContactDto.email }, { phone: createContactDto.phone }],
    });
    if (contactExist) {
      throw new BadRequestException('Contact is already exist');
    }
    const { account, assignedTo, ...contact } = createContactDto;
    let accountExist: Account | null = null;

    if (account) {
      accountExist = await accountRepo.findOne({ where: { name: account } });
      if (!accountExist) {
        throw new NotFoundException('Account not found');
      }
    }
    let existingUser: User | null = null;
    if (assignedTo) {
      existingUser = await userRepo.findOne({ where: { id: assignedTo } });
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }
    }

    await contactRepo.save({
      ...contact,
      createdBy: user,
      accountId: accountExist ?? undefined,
      assignedTo: existingUser ?? undefined,
    });
    const metric: Partial<MetricDto> = { contacts: 1 };
    await this.metricService.updateTenantCounts(tenantId, metric);
    return {
      success: true,
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
    const noteRepo = await getRepo<Note>(Note, tenantId);
    const qb = contactRepo
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.accountId', 'account')
      .leftJoinAndSelect('contact.notes', 'note');

    const { limit, page, skip } = paginationParams(contactQuery.page, contactQuery.limit);
    const FILTERS: FiltersMap = {
      name: { column: 'contact.name', type: 'ilike' },
      email: { column: 'contact.email', type: 'ilike' },
      phone: { column: 'contact.phone', type: 'ilike' },
    };
    applyFilters(qb, FILTERS, contactQuery);

    if (![Role.Admin, Role.Manager].includes(user.role)) {
      qb.andWhere(`user.id =:id`, { id: user.id });
    }

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
      throw new NotFoundException('Contact not found or invalid contact id');
    }
    if (updateContactDto.assignedTo && ![Role.Admin, Role.Manager].includes(user.role)) {
      throw new UnauthorizedException('Not have enough authorization to assign a contact');
    } else {
      assignedUser = await userRepo.findOne({ where: { id: updateContactDto.assignedTo } });
      if (!assignedUser) {
        throw new BadRequestException('Contact is not assigned to invalid id');
      }
    }
    if (updateContactDto.account) {
      accountId = await accountRepo.findOne({ where: { name: updateContactDto.account } });
      if (!accountId) {
        throw new NotFoundException('Account not found');
      }
    }
    contact = {
      ...contact,
      ...updateContact,
      accountId: accountId ?? undefined,
      assignedTo: assignedUser ?? undefined,
      updatedBy: user,
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
