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
import { Lead } from 'src/database/entities/core-app-entities/lead.entity';
import { User } from 'src/database/entities/core-app-entities/user.entity';
import { LeadPreview } from 'src/dtos/lead-dto/lead-preview.dto';
import { LeadToContactDto } from 'src/dtos/lead-dto/lead-to-contact.dto';
import { Role } from 'src/enums/core-app.enum';
import { LeadStatus } from 'src/enums/status.enum';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { ILike } from 'typeorm';
import { CountryService } from './country.service';

@Injectable()
export class LeadConversionService {
  constructor(private readonly countryService: CountryService) {}
  async leadPreview(tenantId: string, id: string): Promise<APIResponse<LeadPreview>> {
    const leadRepo = await getRepo<Lead>(Lead, tenantId);
    const lead = await leadRepo.findOne({ where: { id } });
    const contactRepo = await getRepo<Contact>(Contact, tenantId);
    const accountRepo = await getRepo<Account>(Account, tenantId);
    if (!lead) {
      throw new NotFoundException({ message: 'Lead not found or invalid lead id' });
    } else {
      const account = await accountRepo.findOne({ where: { name: ILike(`%${lead.company}%`) } });
      const contact = await contactRepo.findOne({
        where: [{ email: lead.email }, { phone: lead.phone }],
      });
      const leadPreview: LeadPreview = {
        createAccount: account ? false : true,
        createContact: contact ? false : true,
        accountName: account ? undefined : lead.company,
        contactName: contact ? undefined : lead.name,
      };
      return {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Lead preview fetched successfully',
        data: leadPreview,
      };
    }
  }

  async convertLead(
    tenantId: string,
    id: string,
    user: User,
    leadToContact?: LeadToContactDto,
  ): Promise<APIResponse<unknown>> {
    const leadRepo = await getRepo<Lead>(Lead, tenantId);
    const lead = await leadRepo.findOne({ where: { id }, relations: { assignedTo: true } });
    const contactRepo = await getRepo<Contact>(Contact, tenantId);
    const accountRepo = await getRepo<Account>(Account, tenantId);

    if (!lead) {
      throw new BadRequestException({ message: 'Invalid lead id or lead not found' });
    }
    if (!lead.assignedTo && user.role == Role.SalesRep) {
      throw new UnauthorizedException({
        message: 'Not authorized to convert others lead to contact',
      });
    } else if (lead.assignedTo && lead.assignedTo.id != user.id && user.role == Role.SalesRep) {
      throw new UnauthorizedException({
        message: 'Not authorized to convert others lead to contact',
      });
    }
    if (lead.status === LeadStatus.Disqualified) {
      throw new BadRequestException({
        message: 'Cannot convert disqualified lead first update status',
      });
    }

    const isContact = await contactRepo.findOne({
      where: [{ email: lead.email }, { phone: lead.phone }],
    });
    if (isContact) {
      throw new BadRequestException({ message: 'This lead is already converted into contact' });
    }
    const isAccount = await accountRepo.findOne({ where: { name: ILike(`%${lead.company}%`) } });
    let newAccount = leadToContact?.account
      ? await accountRepo.findOne({
          where: { name: leadToContact?.account?.name },
        })
      : null;

    if (!isAccount && leadToContact && leadToContact.account) {
      const { country, ...accountData } = leadToContact.account;
      let accountCountry: string | undefined;
      if (country) {
        accountCountry = this.countryService.getCountry(country);
      }

      if (!newAccount) {
        newAccount = await accountRepo.save({
          ...accountData,
          createdBy: user,
          country: accountCountry,
        });
      }
    }
    const newContact = await contactRepo.save({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      createdBy: user,
      accountId: isAccount ?? newAccount ?? undefined,
    });
    lead.contact = newContact;
    lead.status = LeadStatus.Converted;
    lead.convertedBy = user;
    await leadRepo.save(lead);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lead is successfully converted into contact',
    };
  }
}
