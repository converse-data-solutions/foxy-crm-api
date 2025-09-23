import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { Contact } from 'src/database/entity/core-app/contact.entity';
import { Deal } from 'src/database/entity/core-app/deal.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { CreateDealDto } from 'src/dto/deal-dto/create-deal.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';

@Injectable()
export class DealService {
  async create(tenantId: string, user: User, createDealDto: CreateDealDto) {
    const dealRepo = await getRepo(Deal, tenantId);
    const contactRepo = await getRepo(Contact, tenantId);
    const { contactId, ...createDeal } = createDealDto;
    const contact = await contactRepo.findOne({
      where: { id: contactId },
    });
    if (!contact) {
      throw new BadRequestException({ message: 'Invalid contact id' });
    }
    await dealRepo.save({ ...createDeal, contactId: contact, createdBy: user });
    return { success: true, statusCode: HttpStatus.CREATED, message: 'Deal created successfully' };
  }

  findAll() {
    return `This action returns all deal`;
  }

  findOne(id: number) {
    return `This action returns a #${id} deal`;
  }
}
