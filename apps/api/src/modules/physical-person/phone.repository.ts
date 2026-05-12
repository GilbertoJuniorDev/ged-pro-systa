import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phone } from '@ged/database';
import type {
  IPhoneRepository,
  CreatePhoneData,
  UpdatePhoneData,
} from './interfaces/phone-repository.interface';

@Injectable()
export class PhoneRepository implements IPhoneRepository {
  constructor(
    @InjectRepository(Phone)
    private readonly repo: Repository<Phone>,
  ) {}

  findByPhysicalPersonId(physicalPersonId: string): Promise<Phone[]> {
    return this.repo.find({ where: { pessoaFisicaId: physicalPersonId }, order: { createdAt: 'ASC' } });
  }

  findById(id: string): Promise<Phone | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: CreatePhoneData): Promise<Phone> {
    const phone = this.repo.create({ ...data, pessoaFisicaId: data.physicalPersonId });
    return this.repo.save(phone);
  }

  async update(id: string, data: UpdatePhoneData): Promise<Phone> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
