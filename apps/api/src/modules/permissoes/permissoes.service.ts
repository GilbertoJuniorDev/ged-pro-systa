import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Permissao } from '@ged/database';
import type {
  IPermissaoRepository,
  CreatePermissaoData,
  UpdatePermissaoData,
} from './interfaces/permissao-repository.interface';

export const PERMISSAO_REPOSITORY = 'PERMISSAO_REPOSITORY';

@Injectable()
export class PermissoesService {
  constructor(
    @Inject(PERMISSAO_REPOSITORY)
    private readonly permissaoRepository: IPermissaoRepository,
  ) {}

  findAll(): Promise<Permissao[]> {
    return this.permissaoRepository.findAll();
  }

  async findById(id: string): Promise<Permissao> {
    const permissao = await this.permissaoRepository.findById(id);
    if (!permissao) throw new NotFoundException('Permissão não encontrada');
    return permissao;
  }

  async create(data: CreatePermissaoData): Promise<Permissao> {
    const existing = await this.permissaoRepository.findByNome(data.nome);
    if (existing) throw new ConflictException('Já existe uma permissão com este nome');
    return this.permissaoRepository.create(data);
  }

  async update(id: string, data: UpdatePermissaoData): Promise<Permissao> {
    await this.findById(id);

    if (data.nome) {
      const existing = await this.permissaoRepository.findByNome(data.nome);
      if (existing && existing.id !== id) {
        throw new ConflictException('Já existe uma permissão com este nome');
      }
    }

    return this.permissaoRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    return this.permissaoRepository.remove(id);
  }
}
