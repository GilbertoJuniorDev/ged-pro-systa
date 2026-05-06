import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '@ged/database';
import type {
  IAddressRepository,
  CreateAddressData,
  UpdateAddressData,
} from './interfaces/address-repository.interface';

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(
    @InjectRepository(Address)
    private readonly repo: Repository<Address>,
  ) {}

  findByPhysicalPersonId(physicalPersonId: string): Promise<Address[]> {
    return this.repo.find({ where: { pessoaFisicaId: physicalPersonId }, order: { createdAt: 'ASC' } });
  }

  findById(id: string): Promise<Address | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: CreateAddressData): Promise<Address> {
    const address = this.repo.create({ ...data, pessoaFisicaId: data.physicalPersonId });
    return this.repo.save(address);
  }

  async update(id: string, data: UpdateAddressData): Promise<Address> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
