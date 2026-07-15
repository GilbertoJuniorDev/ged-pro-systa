import type { Repository, SelectQueryBuilder } from 'typeorm';
import type { Document } from '@ged/database';
import { PublicDocumentsRepository } from './public-documents.repository';

type QueryBuilderMock = {
  [K in keyof SelectQueryBuilder<Document>]: jest.Mock;
};

function makeQueryBuilderMock(): jest.Mocked<SelectQueryBuilder<Document>> {
  const qb: Partial<QueryBuilderMock> = {};
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  qb.skip = jest.fn().mockReturnValue(qb);
  qb.take = jest.fn().mockReturnValue(qb);
  qb.select = jest.fn().mockReturnValue(qb);
  qb.addSelect = jest.fn().mockReturnValue(qb);
  qb.distinct = jest.fn().mockReturnValue(qb);
  qb.getManyAndCount = jest.fn();
  qb.getMany = jest.fn();
  qb.getOne = jest.fn();
  qb.getRawMany = jest.fn();
  return qb as unknown as jest.Mocked<SelectQueryBuilder<Document>>;
}

describe('PublicDocumentsRepository', () => {
  let qb: jest.Mocked<SelectQueryBuilder<Document>>;
  let repo: jest.Mocked<Pick<Repository<Document>, 'createQueryBuilder'>>;
  let repository: PublicDocumentsRepository;

  beforeEach(() => {
    qb = makeQueryBuilderMock();
    repo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    repository = new PublicDocumentsRepository(repo as unknown as Repository<Document>);
  });

  describe('listar', () => {
    it('should always filter confidencialidade=PUBLICO and is_active=true when listing', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.listar({});

      expect(qb.andWhere).toHaveBeenCalledWith('document.confidencialidade = :confidencialidade', {
        confidencialidade: 'PUBLICO',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('document.is_active = :isActive', { isActive: true });
    });

    it('should apply an ILIKE filter on nome when search is provided', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.listar({ search: 'contrato' });

      expect(qb.andWhere).toHaveBeenCalledWith('document.nome ILIKE :search', {
        search: '%contrato%',
      });
    });

    it('should not apply the ILIKE filter when search is not provided', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.listar({});

      expect(qb.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.anything(),
      );
    });

    it('should filter by serie_id when serieId is provided', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.listar({ serieId: 'serie-1' });

      expect(qb.andWhere).toHaveBeenCalledWith('document.serie_id = :serieId', {
        serieId: 'serie-1',
      });
    });

    it('should cap limit at 100 when a larger limit is requested', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.listar({ limit: 500 });

      expect(qb.take).toHaveBeenCalledWith(100);
      expect(result.limit).toBe(100);
    });

    it('should default to page 1 and limit 20 when no pagination is provided', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.listar({});

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(20);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('destaques', () => {
    it('should always filter confidencialidade=PUBLICO, is_active=true and destaque=true', async () => {
      qb.getMany.mockResolvedValue([]);

      await repository.destaques();

      expect(qb.andWhere).toHaveBeenCalledWith('document.confidencialidade = :confidencialidade', {
        confidencialidade: 'PUBLICO',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('document.is_active = :isActive', { isActive: true });
      expect(qb.andWhere).toHaveBeenCalledWith('document.destaque = :destaque', { destaque: true });
    });
  });

  describe('recentes', () => {
    it('should default the take limit to 6 when no limit is provided', async () => {
      qb.getMany.mockResolvedValue([]);

      await repository.recentes();

      expect(qb.take).toHaveBeenCalledWith(6);
    });

    it('should cap the take limit at 20 when a larger limit is requested', async () => {
      qb.getMany.mockResolvedValue([]);

      await repository.recentes(500);

      expect(qb.take).toHaveBeenCalledWith(20);
    });

    it('should always filter confidencialidade=PUBLICO and is_active=true', async () => {
      qb.getMany.mockResolvedValue([]);

      await repository.recentes(3);

      expect(qb.andWhere).toHaveBeenCalledWith('document.confidencialidade = :confidencialidade', {
        confidencialidade: 'PUBLICO',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('document.is_active = :isActive', { isActive: true });
    });
  });

  describe('findById', () => {
    it('should always filter confidencialidade=PUBLICO and is_active=true in addition to the id', async () => {
      qb.getOne.mockResolvedValue(null);

      await repository.findById('doc-1');

      expect(qb.andWhere).toHaveBeenCalledWith('document.confidencialidade = :confidencialidade', {
        confidencialidade: 'PUBLICO',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('document.is_active = :isActive', { isActive: true });
      expect(qb.andWhere).toHaveBeenCalledWith('document.id = :id', { id: 'doc-1' });
    });
  });

  describe('listarSeriesDisponiveis', () => {
    it('should always filter confidencialidade=PUBLICO and is_active=true', async () => {
      qb.getRawMany.mockResolvedValue([]);

      await repository.listarSeriesDisponiveis();

      expect(qb.andWhere).toHaveBeenCalledWith('document.confidencialidade = :confidencialidade', {
        confidencialidade: 'PUBLICO',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('document.is_active = :isActive', { isActive: true });
    });

    it('should select only the distinct serie id/codigo/nome columns', async () => {
      qb.getRawMany.mockResolvedValue([]);

      await repository.listarSeriesDisponiveis();

      expect(qb.select).toHaveBeenCalledWith('serie.id', 'id');
      expect(qb.addSelect).toHaveBeenCalledWith('serie.codigo', 'codigo');
      expect(qb.addSelect).toHaveBeenCalledWith('serie.nome', 'nome');
      expect(qb.distinct).toHaveBeenCalledWith(true);
    });

    it('should return the raw rows produced by the query', async () => {
      const rows = [
        { id: 'serie-1', codigo: 'FIN-01', nome: 'Contratos financeiros' },
        { id: 'serie-2', codigo: 'RH-01', nome: 'Documentos de RH' },
      ];
      qb.getRawMany.mockResolvedValue(rows);

      const result = await repository.listarSeriesDisponiveis();

      expect(result).toEqual(rows);
    });
  });
});
