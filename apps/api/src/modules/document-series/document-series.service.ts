import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department, ROLE, type DocumentSeries, type Role } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import type {
  IDocumentSeriesRepository,
  CreateDocumentSeriesData,
  UpdateDocumentSeriesData,
} from './interfaces/document-series-repository.interface';

export const DOCUMENT_SERIES_REPOSITORY = 'DOCUMENT_SERIES_REPOSITORY';

const MAX_ANCESTOR_WALK = 100;

// Papéis que enxergam todas as séries, sem restrição por departamento.
const PRIVILEGED_ROLES: readonly Role[] = [ROLE.SUPER_ADMIN, ROLE.ADMIN];

@Injectable()
export class DocumentSeriesService {
  constructor(
    @Inject(DOCUMENT_SERIES_REPOSITORY)
    private readonly documentSeriesRepository: IDocumentSeriesRepository,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
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

  private async assertCanAccess(
    documentSeries: DocumentSeries,
    user: JwtPayload,
  ): Promise<void> {
    const allowed = await this.resolveAllowedDepartamentos(user);
    if (allowed === null) {
      return;
    }
    if (!allowed.includes(documentSeries.departamentoId)) {
      throw new NotFoundException('Série de documento não encontrada');
    }
  }

  async findAll(
    departamentoId: string | undefined,
    user: JwtPayload,
  ): Promise<DocumentSeries[]> {
    const allowed = await this.resolveAllowedDepartamentos(user);
    if (allowed === null) {
      return this.documentSeriesRepository.findAll({ departamentoId });
    }
    if (allowed.length === 0) {
      return [];
    }
    if (departamentoId) {
      // Um departamento fora do escopo do usuário não deve vazar dados.
      if (!allowed.includes(departamentoId)) {
        return [];
      }
      return this.documentSeriesRepository.findAll({ departamentoId });
    }
    return this.documentSeriesRepository.findAll({ allowedDepartamentoIds: allowed });
  }

  // `user` opcional: o caminho de escrita (create/update/remove, já restrito por
  // @Permissions via PermissionsGuard) carrega a série sem checagem de escopo. Na leitura,
  // `user` é fornecido e o acesso é validado.
  async findOne(id: string, user?: JwtPayload): Promise<DocumentSeries> {
    const documentSeries = await this.documentSeriesRepository.findById(id);
    if (!documentSeries) {
      throw new NotFoundException('Série de documento não encontrada');
    }
    if (user) {
      await this.assertCanAccess(documentSeries, user);
    }
    return documentSeries;
  }

  async create(data: CreateDocumentSeriesData): Promise<DocumentSeries> {
    const departamento = await this.departmentRepo.findOne({
      where: { id: data.departamentoId },
    });
    if (!departamento) {
      throw new BadRequestException('Departamento não encontrado');
    }

    const existing = await this.documentSeriesRepository.findByDepartamentoAndCodigo(
      data.departamentoId,
      data.codigo,
    );
    if (existing) {
      throw new ConflictException(
        'Já existe uma série com este código neste departamento',
      );
    }

    if (data.seriePaiId) {
      const seriePai = await this.documentSeriesRepository.findById(data.seriePaiId);
      if (!seriePai) {
        throw new BadRequestException('Série pai não encontrada');
      }
      if (seriePai.departamentoId !== data.departamentoId) {
        throw new BadRequestException(
          'A série pai deve pertencer ao mesmo departamento',
        );
      }
    }

    return this.documentSeriesRepository.create(data);
  }

  async update(id: string, data: UpdateDocumentSeriesData): Promise<DocumentSeries> {
    const current = await this.findOne(id);

    if (data.codigo && data.codigo !== current.codigo) {
      const existing = await this.documentSeriesRepository.findByDepartamentoAndCodigo(
        current.departamentoId,
        data.codigo,
      );
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Já existe uma série com este código neste departamento',
        );
      }
    }

    if (data.seriePaiId) {
      if (data.seriePaiId === id) {
        throw new BadRequestException('Uma série não pode ser pai de si mesma');
      }

      const seriePai = await this.documentSeriesRepository.findById(data.seriePaiId);
      if (!seriePai) {
        throw new BadRequestException('Série pai não encontrada');
      }
      if (seriePai.departamentoId !== current.departamentoId) {
        throw new BadRequestException(
          'A série pai deve pertencer ao mesmo departamento',
        );
      }

      let ancestorId = seriePai.seriePaiId;
      let iterations = 0;
      while (ancestorId) {
        if (iterations >= MAX_ANCESTOR_WALK) {
          throw new Error(
            'Limite de profundidade excedido ao verificar hierarquia de séries',
          );
        }
        if (ancestorId === id) {
          throw new BadRequestException(
            'Referência circular na hierarquia de séries',
          );
        }
        const ancestor = await this.documentSeriesRepository.findById(ancestorId);
        ancestorId = ancestor?.seriePaiId ?? null;
        iterations += 1;
      }
    }

    return this.documentSeriesRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.documentSeriesRepository.delete(id);
    } catch (error) {
      if ((error as { code?: string }).code === '23503') {
        throw new ConflictException(
          'Não é possível remover: existem documentos ou séries vinculados a esta série',
        );
      }
      throw error;
    }
  }
}
