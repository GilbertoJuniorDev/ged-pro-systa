import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';
import { CONFIDENCIALIDADE, Document } from '@ged/database';

export interface PublicDocumentQueryFilter {
  readonly search?: string;
  readonly serieId?: string;
  readonly page?: number;
  readonly limit?: number;
}

// Nomeado "Entities" (não "PaginatedPublicDocuments") de propósito: opera sobre a
// entidade Document crua vinda do TypeORM, não sobre o PublicDocumentDto — um tipo
// legitimamente diferente do `PaginatedPublicDocuments` (alias de `PaginatedResult<PublicDocumentDto>`)
// exportado por @ged/types e usado na camada de service/controller.
export interface PaginatedPublicDocumentEntities {
  readonly data: Document[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface PublicSerieOption {
  readonly id: string;
  readonly codigo: string;
  readonly nome: string;
}

const LISTAR_LIMIT_CAP = 100;
const RECENTES_DEFAULT_LIMIT = 6;
const RECENTES_LIMIT_CAP = 20;

// Repositório isolado do módulo público: NUNCA reutiliza DOCUMENT_REPOSITORY/
// IDocumentRepository (department-scoped, usado pelo módulo admin `documents`). Todo
// método aqui filtra incondicionalmente confidencialidade=PUBLICO e is_active=true — não
// existe parâmetro para desligar esse filtro, nem um caminho que o pule.
@Injectable()
export class PublicDocumentsRepository {
  constructor(
    @InjectRepository(Document)
    private readonly repo: Repository<Document>,
  ) {}

  private baseQuery(): SelectQueryBuilder<Document> {
    return this.repo
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.serie', 'serie')
      .andWhere('document.confidencialidade = :confidencialidade', {
        confidencialidade: CONFIDENCIALIDADE.PUBLICO,
      })
      .andWhere('document.is_active = :isActive', { isActive: true });
  }

  async listar(filter: PublicDocumentQueryFilter): Promise<PaginatedPublicDocumentEntities> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, LISTAR_LIMIT_CAP);
    const skip = (page - 1) * limit;

    const qb = this.baseQuery().orderBy('document.createdAt', 'DESC').skip(skip).take(limit);

    if (filter.search) {
      qb.andWhere('document.nome ILIKE :search', { search: `%${filter.search}%` });
    }
    if (filter.serieId) {
      qb.andWhere('document.serie_id = :serieId', { serieId: filter.serieId });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  destaques(): Promise<Document[]> {
    return this.baseQuery()
      .andWhere('document.destaque = :destaque', { destaque: true })
      .orderBy('document.createdAt', 'DESC')
      .getMany();
  }

  recentes(limit?: number): Promise<Document[]> {
    const take = Math.min(limit ?? RECENTES_DEFAULT_LIMIT, RECENTES_LIMIT_CAP);
    return this.baseQuery().orderBy('document.createdAt', 'DESC').take(take).getMany();
  }

  findById(id: string): Promise<Document | null> {
    return this.baseQuery().andWhere('document.id = :id', { id }).getOne();
  }

  // Projeção enxuta (id/codigo/nome da série) para popular o filtro do portal com a lista
  // completa de séries disponíveis — não a entidade Document inteira, então `select`
  // substitui por completo os selects automáticos de `leftJoinAndSelect` em baseQuery().
  listarSeriesDisponiveis(): Promise<PublicSerieOption[]> {
    return this.baseQuery()
      .select('serie.id', 'id')
      .addSelect('serie.codigo', 'codigo')
      .addSelect('serie.nome', 'nome')
      .distinct(true)
      .orderBy('serie.nome', 'ASC')
      .getRawMany<PublicSerieOption>();
  }
}
