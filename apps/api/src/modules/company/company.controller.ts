import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CompanyService } from './company.service';
import { UpsertCompanyDto } from './dto/upsert-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

@ApiTags('company')
@ApiBearerAuth()
@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Get the singleton Company (tenant data)' })
  async findOne(): Promise<CompanyResponseDto> {
    const company = await this.companyService.getSingleton();
    return this.toResponse(company);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiOperation({ summary: 'Create or update the singleton Company' })
  async upsert(
    @Body() dto: UpsertCompanyDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyResponseDto> {
    const company = await this.companyService.upsert(user.sub, {
      cnpj: dto.cnpj,
      razaoSocial: dto.razaoSocial,
      nomeFantasia: dto.nomeFantasia ?? null,
      nomeEmpresarial: dto.nomeEmpresarial ?? null,
      inscricaoEstadual: dto.inscricaoEstadual ?? null,
      matriz: dto.matriz ?? true,
      dataAbertura: dto.dataAbertura ?? null,
      porte: dto.porte ?? null,
      naturezaJuridicaCodigo: dto.naturezaJuridicaCodigo ?? null,
      naturezaJuridicaDescricao: dto.naturezaJuridicaDescricao ?? null,
      situacaoCadastral: dto.situacaoCadastral ?? null,
      situacaoCadastralData: dto.situacaoCadastralData ?? null,
    });
    return this.toResponse(company);
  }

  private toResponse(c: {
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string | null;
    nomeEmpresarial: string | null;
    inscricaoEstadual: string | null;
    matriz: boolean;
    dataAbertura: Date | null;
    porte: string | null;
    naturezaJuridicaCodigo: string | null;
    naturezaJuridicaDescricao: string | null;
    situacaoCadastral: string | null;
    situacaoCadastralData: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): CompanyResponseDto {
    return new CompanyResponseDto({
      id: c.id,
      cnpj: c.cnpj,
      razaoSocial: c.razaoSocial,
      nomeFantasia: c.nomeFantasia,
      nomeEmpresarial: c.nomeEmpresarial,
      inscricaoEstadual: c.inscricaoEstadual,
      matriz: c.matriz,
      dataAbertura: c.dataAbertura,
      porte: c.porte,
      naturezaJuridicaCodigo: c.naturezaJuridicaCodigo,
      naturezaJuridicaDescricao: c.naturezaJuridicaDescricao,
      situacaoCadastral: c.situacaoCadastral,
      situacaoCadastralData: c.situacaoCadastralData,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
  }
}
