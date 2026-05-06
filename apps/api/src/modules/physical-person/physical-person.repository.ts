import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhysicalPerson } from '@ged/database';
import type {
  IPhysicalPersonRepository,
  CreatePhysicalPersonData,
  UpdatePhysicalPersonData,
} from './interfaces/physical-person-repository.interface';

@Injectable()
export class PhysicalPersonRepository implements IPhysicalPersonRepository {
  constructor(
    @InjectRepository(PhysicalPerson)
    private readonly repo: Repository<PhysicalPerson>,
  ) {}

  findByUserId(userId: string): Promise<PhysicalPerson | null> {
    return this.repo.findOne({ where: { userId } });
  }

  findById(id: string): Promise<PhysicalPerson | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCpf(cpf: string): Promise<PhysicalPerson | null> {
    return this.repo.findOne({ where: { cpf } });
  }

  async create(data: CreatePhysicalPersonData): Promise<PhysicalPerson> {
    const pf = this.repo.create(data);
    return this.repo.save(pf);
  }

  async update(id: string, data: UpdatePhysicalPersonData): Promise<PhysicalPerson> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
