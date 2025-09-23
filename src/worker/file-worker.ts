import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as csv from 'csv-parser';
import { Lead } from 'src/database/entity/core-app/lead.entity';
import { User } from 'src/database/entity/core-app/user.entity';
import { CreateLeadDto } from 'src/dto/lead-dto/create-lead.dto';
import { getRepo } from 'src/shared/database-connection/get-connection';
import { Readable } from 'stream';

interface SerializedBuffer {
  type: 'Buffer';
  data: number[];
}

@Processor('file-import')
export class FileWorker extends WorkerHost {
  async process(job: Job) {
    const { file, tenant, user } = job.data;
    await this.importCsv(file, tenant, user);
  }

  async importCsv(file: Express.Multer.File, tenant: string, user: User) {
    const results: Partial<Lead>[] = [];
    const leadRepo = await getRepo(Lead, tenant);
    const leads = await leadRepo.find({ select: { email: true, phone: true } });

    new Promise((resolve, reject) => {
      const serializedBuffer = file.buffer as unknown as SerializedBuffer;

      const buffer = Buffer.from(serializedBuffer.data);
      const stream = new Readable();

      stream.push(buffer);
      stream.push(null);

      stream
        .pipe(csv())
        .on('data', (row: CreateLeadDto) => {
          results.push({
            name: row['name'],
            email: row['email'],
            phone: row['phone'],
            company: row['company'] || undefined,
            source: row['source'] || undefined,
            createdBy: user,
          });
        })
        .on('end', async () => {
          const finalLead = results.filter(
            (result) =>
              !leads.some((lead) => lead.email === result.email || lead.phone === result.phone),
          );
          if (finalLead.length > 0) {
            const newLeads = leadRepo.create(finalLead);
            await leadRepo.save(newLeads);
          }
          resolve(results as Lead[]);
        })
        .on('error', (err) => reject(err));
    });
  }
}
