import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Address, PhysicalPerson, Phone } from '@ged/database';
import type {
  IPhysicalPersonRepository,
  CreatePhysicalPersonData,
  UpdatePhysicalPersonData,
} from './interfaces/physical-person-repository.interface';
import type {
  IAddressRepository,
  CreateAddressData,
  UpdateAddressData,
} from './interfaces/address-repository.interface';
import type {
  IPhoneRepository,
  CreatePhoneData,
  UpdatePhoneData,
} from './interfaces/phone-repository.interface';

export const PHYSICAL_PERSON_REPOSITORY = 'PHYSICAL_PERSON_REPOSITORY';
export const ADDRESS_REPOSITORY = 'ADDRESS_REPOSITORY';
export const PHONE_REPOSITORY = 'PHONE_REPOSITORY';

@Injectable()
export class PhysicalPersonService {
  constructor(
    @Inject(PHYSICAL_PERSON_REPOSITORY)
    private readonly pfRepository: IPhysicalPersonRepository,
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(PHONE_REPOSITORY)
    private readonly phoneRepository: IPhoneRepository,
  ) {}

  // ── PhysicalPerson ────────────────────────────────────────────────

  async findByUserId(userId: string): Promise<PhysicalPerson> {
    const pf = await this.pfRepository.findByUserId(userId);
    if (!pf) throw new NotFoundException('Physical person profile not found');
    return pf;
  }

  async create(
    requesterId: string,
    requesterRole: string,
    userId: string,
    data: CreatePhysicalPersonData,
  ): Promise<PhysicalPerson> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);

    const existsByUser = await this.pfRepository.findByUserId(userId);
    if (existsByUser) {
      throw new ConflictException('Physical person profile already exists for this user');
    }

    const existsByCpf = await this.pfRepository.findByCpf(data.cpf);
    if (existsByCpf) {
      throw new ConflictException('CPF already registered');
    }

    return this.pfRepository.create({ ...data, userId });
  }

  async update(
    requesterId: string,
    requesterRole: string,
    userId: string,
    data: UpdatePhysicalPersonData,
  ): Promise<PhysicalPerson> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    const pf = await this.findByUserId(userId);
    return this.pfRepository.update(pf.id, data);
  }

  // ── Addresses ────────────────────────────────────────────────────

  async findAddresses(
    requesterId: string,
    requesterRole: string,
    userId: string,
  ): Promise<Address[]> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    const pf = await this.findByUserId(userId);
    return this.addressRepository.findByPhysicalPersonId(pf.id);
  }

  async createAddress(
    requesterId: string,
    requesterRole: string,
    userId: string,
    data: Omit<CreateAddressData, 'physicalPersonId'>,
  ): Promise<Address> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    const pf = await this.findByUserId(userId);
    return this.addressRepository.create({ ...data, physicalPersonId: pf.id });
  }

  async updateAddress(
    requesterId: string,
    requesterRole: string,
    userId: string,
    addressId: string,
    data: UpdateAddressData,
  ): Promise<Address> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    await this.assertAddressOwnership(userId, addressId);
    return this.addressRepository.update(addressId, data);
  }

  async removeAddress(
    requesterId: string,
    requesterRole: string,
    userId: string,
    addressId: string,
  ): Promise<void> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    await this.assertAddressOwnership(userId, addressId);
    return this.addressRepository.remove(addressId);
  }

  // ── Phones ────────────────────────────────────────────────────────

  async findPhones(
    requesterId: string,
    requesterRole: string,
    userId: string,
  ): Promise<Phone[]> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    const pf = await this.findByUserId(userId);
    return this.phoneRepository.findByPhysicalPersonId(pf.id);
  }

  async createPhone(
    requesterId: string,
    requesterRole: string,
    userId: string,
    data: Omit<CreatePhoneData, 'physicalPersonId'>,
  ): Promise<Phone> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    const pf = await this.findByUserId(userId);
    return this.phoneRepository.create({ ...data, physicalPersonId: pf.id });
  }

  async updatePhone(
    requesterId: string,
    requesterRole: string,
    userId: string,
    phoneId: string,
    data: UpdatePhoneData,
  ): Promise<Phone> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    await this.assertPhoneOwnership(userId, phoneId);
    return this.phoneRepository.update(phoneId, data);
  }

  async removePhone(
    requesterId: string,
    requesterRole: string,
    userId: string,
    phoneId: string,
  ): Promise<void> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    await this.assertPhoneOwnership(userId, phoneId);
    return this.phoneRepository.remove(phoneId);
  }

  // ── Private helpers ───────────────────────────────────────────────

  private assertOwnerOrAdmin(
    requesterId: string,
    requesterRole: string,
    targetUserId: string,
  ): void {
    if (requesterRole !== 'ADMIN' && requesterId !== targetUserId) {
      throw new ForbiddenException('Access denied');
    }
  }

  private async assertAddressOwnership(
    userId: string,
    addressId: string,
  ): Promise<void> {
    const pf = await this.findByUserId(userId);
    const address = await this.addressRepository.findById(addressId);
    if (!address || address.pessoaFisicaId !== pf.id) {
      throw new NotFoundException('Address not found');
    }
  }

  private async assertPhoneOwnership(
    userId: string,
    phoneId: string,
  ): Promise<void> {
    const pf = await this.findByUserId(userId);
    const phone = await this.phoneRepository.findById(phoneId);
    if (!phone || phone.pessoaFisicaId !== pf.id) {
      throw new NotFoundException('Phone not found');
    }
  }
}

