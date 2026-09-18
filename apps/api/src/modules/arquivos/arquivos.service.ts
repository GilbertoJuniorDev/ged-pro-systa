import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { Arquivo, Role } from '@ged/database';
import { ARQUIVO_STATUS, Department, ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import { CreateArquivoUseCase, type CreateArquivoData } from './use-cases/create-arquivo.use-case';
import type {
  IArquivoRepository,
  ArquivoQueryFilter,
  PaginatedArquivos,
} from './interfaces/arquivo-repository.interface';

export const ARQUIVO_REPOSITORY = 'ARQUIVO_REPOSITORY';

// Papéis que enxergam todos os arquivos, sem restrição por departamento.
const PRIVILEGED_ROLES: readonly Role[] = [ROLE.SUPER_ADMIN, ROLE.ADMIN];

export interface UpdateArquivoInput {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly predio?: string | null;
  readonly sala?: string | null;
  readonly estante?: string | null;
  readonly prateleira?: string | null;
  readonly caixa?: string | null;
  readonly departamentoIds?: readonly string[];
}

@Injectable()
export class ArquivosService {
  constructor(
    @Inject(ARQUIVO_REPOSITORY)
    private readonly arquivoRepository: IArquivoRepository,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    private readonly userDepartmentsService: UserDepartmentsService,
    private readonly createArquivoUseCase: CreateArquivoUseCase,
  ) {}

  // null = papel privilegiado (sem restrição); caso contrário a lista de departamentoIds
  // vinculados ao usuário (pode ser vazia).
  private async resolveAllowedDepartamentos(
    user: JwtPayload,
  ): Promise<readonly string[] | null> {
    if (PRIVILEGED_ROLES.includes(user.role)) {
      return null;
    }
    const departments = await this.userDepartmentsService.findByUserId(user.sub);
    return departments.map((department) => department.departamentoId);
  }

  private async assertCanAccess(arquivo: Arquivo, user: JwtPayload): Promise<void> {
    const allowed = await this.resolveAllowedDepartamentos(user);
    if (allowed === null) {
      return;
    }
    const vinculados = await this.arquivoRepository.findDepartamentoIds(arquivo.id);
    const escopo = [arquivo.departamentoId, ...vinculados];
    if (!allowed.some((id) => escopo.includes(id))) {
      throw new NotFoundException('Arquivo não encontrado');
    }
  }

  async findAll(
    filter: Omit<ArquivoQueryFilter, 'allowedDepartamentoIds'>,
    user: JwtPayload,
  ): Promise<PaginatedArquivos> {
    const allowed = await this.resolveAllowedDepartamentos(user);
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    if (allowed === null) {
      return this.arquivoRepository.findAll(filter);
    }
    if (allowed.length === 0) {
      return { data: [], total: 0, page, limit };
    }
    if (filter.departamentoId && !allowed.includes(filter.departamentoId)) {
      // Um departamento fora do escopo do usuário não deve vazar dados.
      return { data: [], total: 0, page, limit };
    }
    return this.arquivoRepository.findAll({ ...filter, allowedDepartamentoIds: allowed });
  }

  // `user` opcional: o caminho de escrita (já restrito por @Permissions via PermissionsGuard)
  // carrega o arquivo sem checagem de escopo. Na leitura, `user` é fornecido e validado.
  async findOne(id: string, user?: JwtPayload): Promise<Arquivo> {
    const arquivo = await this.arquivoRepository.findById(id);
    if (!arquivo) throw new NotFoundException('Arquivo não encontrado');
    if (user) {
      await this.assertCanAccess(arquivo, user);
    }
    return arquivo;
  }

  findDepartamentoIds(id: string): Promise<string[]> {
    return this.arquivoRepository.findDepartamentoIds(id);
  }

  findDepartamentoIdsByArquivos(ids: readonly string[]): Promise<Map<string, string[]>> {
    return this.arquivoRepository.findDepartamentoIdsByArquivos(ids);
  }

  countDossiesByArquivo(ids: readonly string[]): Promise<Map<string, number>> {
    return this.arquivoRepository.countDossiesByArquivo(ids);
  }

  create(data: CreateArquivoData): Promise<Arquivo> {
    return this.createArquivoUseCase.execute(data);
  }

  async update(id: string, data: UpdateArquivoInput): Promise<Arquivo> {
    const current = await this.findOne(id);
    if (current.status === ARQUIVO_STATUS.FECHADO) {
      throw new ConflictException('Arquivo encerrado: reabra o arquivo para alterá-lo');
    }

    const { departamentoIds, ...scalar } = data;

    if (departamentoIds !== undefined) {
      const extra = [...new Set(departamentoIds)].filter((depId) => depId !== current.departamentoId);
      if (extra.length > 0) {
        const found = await this.departmentRepository.find({ where: { id: In(extra) } });
        if (found.length !== extra.length) {
          throw new BadRequestException(
            'Um ou mais departamentos vinculados não foram encontrados',
          );
        }
      }
      await this.arquivoRepository.syncDepartamentos(id, extra);
    }

    const hasScalarChanges = Object.values(scalar).some((value) => value !== undefined);
    if (hasScalarChanges) {
      return this.arquivoRepository.update(id, scalar);
    }
    return this.findOne(id);
  }

  async encerrar(id: string, user: JwtPayload): Promise<Arquivo> {
    const current = await this.findOne(id);
    if (current.status === ARQUIVO_STATUS.FECHADO) {
      throw new ConflictException('Arquivo já está encerrado');
    }
    return this.arquivoRepository.update(id, {
      status: ARQUIVO_STATUS.FECHADO,
      dataEncerramento: new Date(),
      encerradoPorId: user.sub,
    });
  }

  async reabrir(id: string): Promise<Arquivo> {
    const current = await this.findOne(id);
    if (current.status === ARQUIVO_STATUS.ABERTO) {
      throw new ConflictException('Arquivo já está aberto');
    }
    return this.arquivoRepository.update(id, {
      status: ARQUIVO_STATUS.ABERTO,
      dataEncerramento: null,
      encerradoPorId: null,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.arquivoRepository.delete(id);
    } catch (error) {
      if ((error as { code?: string }).code === '23503') {
        throw new ConflictException(
          'Não é possível remover: existem dossiês vinculados a este arquivo',
        );
      }
      throw error;
    }
  }
}
