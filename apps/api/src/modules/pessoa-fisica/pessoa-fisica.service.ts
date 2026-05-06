import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Endereco, PessoaFisica, Telefone } from '@ged/database';
import type {
  IPessoaFisicaRepository,
  CreatePessoaFisicaData,
  UpdatePessoaFisicaData,
} from './interfaces/pessoa-fisica-repository.interface';
import type {
  IEnderecoRepository,
  CreateEnderecoData,
  UpdateEnderecoData,
} from './interfaces/endereco-repository.interface';
import type {
  ITelefoneRepository,
  CreateTelefoneData,
  UpdateTelefoneData,
} from './interfaces/telefone-repository.interface';

export const PESSOA_FISICA_REPOSITORY = 'PESSOA_FISICA_REPOSITORY';
export const ENDERECO_REPOSITORY = 'ENDERECO_REPOSITORY';
export const TELEFONE_REPOSITORY = 'TELEFONE_REPOSITORY';

@Injectable()
export class PessoaFisicaService {
  constructor(
    @Inject(PESSOA_FISICA_REPOSITORY)
    private readonly pfRepository: IPessoaFisicaRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    @Inject(TELEFONE_REPOSITORY)
    private readonly telefoneRepository: ITelefoneRepository,
  ) {}

  // ── PessoaFisica ────────────────────────────────────────────────

  async findByUserId(userId: string): Promise<PessoaFisica> {
    const pf = await this.pfRepository.findByUserId(userId);
    if (!pf) throw new NotFoundException('Perfil pessoal não encontrado');
    return pf;
  }

  async create(
    requesterId: string,
    requesterRole: string,
    userId: string,
    data: CreatePessoaFisicaData,
  ): Promise<PessoaFisica> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);

    const existsByUser = await this.pfRepository.findByUserId(userId);
    if (existsByUser) {
      throw new ConflictException('Perfil pessoal já existe para este usuário');
    }

    const existsByCpf = await this.pfRepository.findByCpf(data.cpf);
    if (existsByCpf) {
      throw new ConflictException('CPF já cadastrado');
    }

    return this.pfRepository.create({ ...data, userId });
  }

  async update(
    requesterId: string,
    requesterRole: string,
    userId: string,
    data: UpdatePessoaFisicaData,
  ): Promise<PessoaFisica> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    const pf = await this.findByUserId(userId);
    return this.pfRepository.update(pf.id, data);
  }

  // ── Endereços ────────────────────────────────────────────────────

  async findEnderecos(
    requesterId: string,
    requesterRole: string,
    userId: string,
  ): Promise<Endereco[]> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    const pf = await this.findByUserId(userId);
    return this.enderecoRepository.findByPessoaFisicaId(pf.id);
  }

  async createEndereco(
    requesterId: string,
    requesterRole: string,
    userId: string,
    data: Omit<CreateEnderecoData, 'pessoaFisicaId'>,
  ): Promise<Endereco> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    const pf = await this.findByUserId(userId);
    return this.enderecoRepository.create({ ...data, pessoaFisicaId: pf.id });
  }

  async updateEndereco(
    requesterId: string,
    requesterRole: string,
    userId: string,
    enderecoId: string,
    data: UpdateEnderecoData,
  ): Promise<Endereco> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    await this.assertEnderecoOwnership(userId, enderecoId);
    return this.enderecoRepository.update(enderecoId, data);
  }

  async removeEndereco(
    requesterId: string,
    requesterRole: string,
    userId: string,
    enderecoId: string,
  ): Promise<void> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    await this.assertEnderecoOwnership(userId, enderecoId);
    return this.enderecoRepository.remove(enderecoId);
  }

  // ── Telefones ────────────────────────────────────────────────────

  async findTelefones(
    requesterId: string,
    requesterRole: string,
    userId: string,
  ): Promise<Telefone[]> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    const pf = await this.findByUserId(userId);
    return this.telefoneRepository.findByPessoaFisicaId(pf.id);
  }

  async createTelefone(
    requesterId: string,
    requesterRole: string,
    userId: string,
    data: Omit<CreateTelefoneData, 'pessoaFisicaId'>,
  ): Promise<Telefone> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    const pf = await this.findByUserId(userId);
    return this.telefoneRepository.create({ ...data, pessoaFisicaId: pf.id });
  }

  async updateTelefone(
    requesterId: string,
    requesterRole: string,
    userId: string,
    telefoneId: string,
    data: UpdateTelefoneData,
  ): Promise<Telefone> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    await this.assertTelefoneOwnership(userId, telefoneId);
    return this.telefoneRepository.update(telefoneId, data);
  }

  async removeTelefone(
    requesterId: string,
    requesterRole: string,
    userId: string,
    telefoneId: string,
  ): Promise<void> {
    this.assertOwnerOrAdmin(requesterId, requesterRole, userId);
    await this.assertTelefoneOwnership(userId, telefoneId);
    return this.telefoneRepository.remove(telefoneId);
  }

  // ── Helpers privados ─────────────────────────────────────────────

  private assertOwnerOrAdmin(
    requesterId: string,
    requesterRole: string,
    targetUserId: string,
  ): void {
    if (requesterRole !== 'ADMIN' && requesterId !== targetUserId) {
      throw new ForbiddenException('Acesso negado');
    }
  }

  private async assertEnderecoOwnership(
    userId: string,
    enderecoId: string,
  ): Promise<void> {
    const pf = await this.findByUserId(userId);
    const endereco = await this.enderecoRepository.findById(enderecoId);
    if (!endereco || endereco.pessoaFisicaId !== pf.id) {
      throw new NotFoundException('Endereço não encontrado');
    }
  }

  private async assertTelefoneOwnership(
    userId: string,
    telefoneId: string,
  ): Promise<void> {
    const pf = await this.findByUserId(userId);
    const telefone = await this.telefoneRepository.findById(telefoneId);
    if (!telefone || telefone.pessoaFisicaId !== pf.id) {
      throw new NotFoundException('Telefone não encontrado');
    }
  }
}
