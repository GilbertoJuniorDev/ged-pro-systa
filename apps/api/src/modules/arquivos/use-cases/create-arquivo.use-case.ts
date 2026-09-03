import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { Arquivo, ArquivoDepartment, Department } from '@ged/database';
import { formatArquivoCodigo } from '../arquivo-codigo';

export interface CreateArquivoData {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly predio?: string | null;
  readonly sala?: string | null;
  readonly estante?: string | null;
  readonly prateleira?: string | null;
  readonly caixa?: string | null;
  readonly departamentoId: string;
  readonly departamentoIds?: readonly string[];
}

// A alocação de sequência corre dentro da transação, atrás de um advisory lock por
// departamento+ano — serializa criações concorrentes no mesmo par sem lockar a tabela
// inteira. O retry cobre apenas o caso residual de violação de unicidade (23505).
const MAX_RETRIES = 3;

@Injectable()
export class CreateArquivoUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(data: CreateArquivoData): Promise<Arquivo> {
    const departamento = await this.dataSource.manager.findOne(Department, {
      where: { id: data.departamentoId },
    });
    if (!departamento) {
      throw new BadRequestException('Departamento não encontrado');
    }

    const departamentoIds = [...new Set(data.departamentoIds ?? [])].filter(
      (id) => id !== data.departamentoId,
    );
    if (departamentoIds.length > 0) {
      const found = await this.dataSource.manager.findBy(Department, { id: In(departamentoIds) });
      if (found.length !== departamentoIds.length) {
        throw new BadRequestException(
          'Um ou mais departamentos vinculados não foram encontrados',
        );
      }
    }

    const ano = new Date().getFullYear();

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        return await this.dataSource.transaction(async (manager) => {
          await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
            `arquivos:${data.departamentoId}:${ano}`,
          ]);

          const raw = await manager
            .createQueryBuilder(Arquivo, 'arquivo')
            .select('MAX(arquivo.sequencia)', 'max')
            .where('arquivo.departamento_id = :departamentoId', {
              departamentoId: data.departamentoId,
            })
            .andWhere('arquivo.ano = :ano', { ano })
            .getRawOne<{ max: number | null }>();
          const sequencia = (raw?.max ?? 0) + 1;
          const codigo = formatArquivoCodigo(ano, sequencia);

          const arquivo = manager.create(Arquivo, {
            codigo,
            ano,
            sequencia,
            nome: data.nome,
            descricao: data.descricao ?? null,
            predio: data.predio ?? null,
            sala: data.sala ?? null,
            estante: data.estante ?? null,
            prateleira: data.prateleira ?? null,
            caixa: data.caixa ?? null,
            departamentoId: data.departamentoId,
          });
          const saved = await manager.save(Arquivo, arquivo);

          if (departamentoIds.length > 0) {
            const rows = departamentoIds.map((departamentoId) =>
              manager.create(ArquivoDepartment, { arquivoId: saved.id, departamentoId }),
            );
            await manager.save(ArquivoDepartment, rows);
          }

          return saved;
        });
      } catch (error) {
        const isUniqueViolation = (error as { code?: string }).code === '23505';
        if (isUniqueViolation && attempt < MAX_RETRIES - 1) {
          continue;
        }
        if (isUniqueViolation) {
          throw new ConflictException(
            'Não foi possível gerar o código do arquivo, tente novamente',
          );
        }
        throw error;
      }
    }

    throw new ConflictException('Não foi possível gerar o código do arquivo, tente novamente');
  }
}
