import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Dossie, Role } from '@ged/database';
import { Department, ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import type {
  IDossieRepository,
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
    private readonly userDepartmentsService: UserDepartmentsService,
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

  private async assertCanAccess(dossie: Dossie, user: JwtPayload): Promise<void> {
    const allowed = await this.resolveAllowedDepartamentos(user);
    if (allowed === null) {
      return;
    }
    if (!allowed.includes(dossie.departamentoId)) {
      throw new NotFoundException('Dossiê não encontrado');
    }
  }

  async findAll(departamentoId: string | undefined, user: JwtPayload): Promise<Dossie[]> {
    const allowed = await this.resolveAllowedDepartamentos(user);
    if (allowed === null) {
      return this.dossieRepository.findAll({ departamentoId });
    }
    if (allowed.length === 0) {
      return [];
    }
    if (departamentoId) {
      // Um departamento fora do escopo do usuário não deve vazar dados.
      if (!allowed.includes(departamentoId)) {
        return [];
      }
      return this.dossieRepository.findAll({ departamentoId });
    }
    return this.dossieRepository.findAll({ allowedDepartamentoIds: allowed });
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

    return this.dossieRepository.create(data);
  }

  async update(id: string, data: UpdateDossieData): Promise<Dossie> {
    await this.findOne(id);
    return this.dossieRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    return this.dossieRepository.delete(id);
  }
}
