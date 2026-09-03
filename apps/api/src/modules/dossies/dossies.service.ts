import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Dossie, Role } from '@ged/database';
import { ARQUIVO_STATUS, Arquivo, Department, ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import { resolveAccessScope } from '../documents/access-scope';
import type {
  IDossieRepository,
  DossieQueryFilter,
  PaginatedDossies,
  CreateDossieData,
  UpdateDossieData,
} from './interfaces/dossie-repository.interface';

export const DOSSIE_REPOSITORY = 'DOSSIE_REPOSITORY';

// Papéis que enxergam todos os dossiês, sem restrição por departamento.
const PRIVILEGED_ROLES: readonly Role[] = [ROLE.SUPER_ADMIN, ROLE.ADMIN];

@Injectable()
export class DossiesService {
  constructor(
    @Inject(DOSSIE_REPOSITORY)
    private readonly dossieRepository: IDossieRepository,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Arquivo)
    private readonly arquivoRepository: Repository<Arquivo>,
    private readonly userDepartmentsService: UserDepartmentsService,
  ) {}

  private async assertArquivoValido(arquivoId: string, departamentoId: string): Promise<void> {
    const arquivo = await this.arquivoRepository.findOne({ where: { id: arquivoId } });
    if (!arquivo) {
      throw new BadRequestException('Arquivo não encontrado');
    }
    if (arquivo.departamentoId !== departamentoId) {
      throw new BadRequestException('O arquivo deve pertencer ao mesmo departamento do dossiê');
    }
    if (arquivo.status === ARQUIVO_STATUS.FECHADO) {
      throw new BadRequestException('Não é possível vincular dossiês a um arquivo encerrado');
    }
  }

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

  private async assertCanAccess(dossie: Dossie, user: JwtPayload): Promise<void> {
    const allowed = await this.resolveAllowedDepartamentos(user);
    if (allowed === null) {
      return;
    }
    if (!allowed.includes(dossie.departamentoId)) {
      throw new NotFoundException('Dossiê não encontrado');
    }
  }

  async findAll(
    filter: Omit<DossieQueryFilter, 'allowedDepartamentoIds'>,
    user: JwtPayload,
  ): Promise<PaginatedDossies> {
    const allowed = await this.resolveAllowedDepartamentos(user);
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    if (allowed === null) {
      return this.dossieRepository.findAll(filter);
    }
    if (allowed.length === 0) {
      return { data: [], total: 0, page, limit };
    }
    if (filter.departamentoId && !allowed.includes(filter.departamentoId)) {
      // Um departamento fora do escopo do usuário não deve vazar dados.
      return { data: [], total: 0, page, limit };
    }
    return this.dossieRepository.findAll({ ...filter, allowedDepartamentoIds: allowed });
  }

  async countDocumentsByDossie(
    dossieIds: readonly string[],
    user: JwtPayload,
  ): Promise<Map<string, number>> {
    const accessScope = await resolveAccessScope(user, this.userDepartmentsService);
    return this.dossieRepository.countDocumentsByDossie(dossieIds, accessScope);
  }

  // `user` opcional: o caminho de escrita (update/remove, já restrito por @Permissions via
  // PermissionsGuard) carrega o dossiê sem checagem de escopo. Na leitura, `user` é
  // fornecido e o acesso é validado.
  async findOne(id: string, user?: JwtPayload): Promise<Dossie> {
    const dossie = await this.dossieRepository.findById(id);
    if (!dossie) throw new NotFoundException('Dossiê não encontrado');
    if (user) {
      await this.assertCanAccess(dossie, user);
    }
    return dossie;
  }

  async create(data: CreateDossieData): Promise<Dossie> {
    const department = await this.departmentRepository.findOne({
      where: { id: data.departamentoId },
    });
    if (!department) {
      throw new BadRequestException('Departamento não encontrado');
    }

    if (data.arquivoId) {
      await this.assertArquivoValido(data.arquivoId, data.departamentoId);
    }

    return this.dossieRepository.create(data);
  }

  async update(id: string, data: UpdateDossieData): Promise<Dossie> {
    const current = await this.findOne(id);
    if (data.arquivoId) {
      await this.assertArquivoValido(data.arquivoId, current.departamentoId);
    }
    return this.dossieRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    return this.dossieRepository.delete(id);
  }
}
