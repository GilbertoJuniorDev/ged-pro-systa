import type { Phone, PhoneType } from '@ged/database';

export interface CreatePhoneData {
  readonly physicalPersonId: string;
  readonly tipo: PhoneType;
  readonly numero: string;
}

export interface UpdatePhoneData {
  readonly tipo?: PhoneType;
  readonly numero?: string;
}

export interface IPhoneRepository {
  findByPhysicalPersonId(physicalPersonId: string): Promise<Phone[]>;
  findById(id: string): Promise<Phone | null>;
  create(data: CreatePhoneData): Promise<Phone>;
  update(id: string, data: UpdatePhoneData): Promise<Phone>;
  remove(id: string): Promise<void>;
}
