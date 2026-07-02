import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@ged/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all departments' })
  @ApiResponse({ status: 200, description: 'Departments listed successfully' })
  async findAll(): Promise<DepartmentResponseDto[]> {
    const departments = await this.departmentsService.findAll();
    return departments.map((d) => new DepartmentResponseDto(d));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({ status: 200, description: 'Department found' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async findOne(@Param('id') id: string): Promise<DepartmentResponseDto> {
    const department = await this.departmentsService.findOne(id);
    return new DepartmentResponseDto(department);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  @ApiResponse({ status: 409, description: 'Department name already exists' })
  async create(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    const department = await this.departmentsService.create(dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'CRIAR_DEPARTAMENTO',
      entidade: 'Department',
      entidadeId: department.id,
      dadosAnteriores: null,
      dadosNovos: {
        id: department.id,
        nome: department.nome,
        descricao: department.descricao,
        isActive: department.isActive,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return new DepartmentResponseDto(department);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 409, description: 'Department name already exists' })
  async update(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    const before = await this.departmentsService.findOne(id);
    const department = await this.departmentsService.update(id, dto);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'ATUALIZAR_DEPARTAMENTO',
      entidade: 'Department',
      entidadeId: department.id,
      dadosAnteriores: {
        id: before.id,
        nome: before.nome,
        descricao: before.descricao,
        isActive: before.isActive,
      },
      dadosNovos: {
        id: department.id,
        nome: department.nome,
        descricao: department.descricao,
        isActive: department.isActive,
      },
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
    return new DepartmentResponseDto(department);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({ status: 204, description: 'Department deleted successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async remove(
    @Req() req: HttpRequest,
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    const before = await this.departmentsService.findOne(id);
    await this.departmentsService.remove(id);
    void this.auditLogsService.log({
      usuarioId: currentUser.sub,
      acao: 'DELETAR_DEPARTAMENTO',
      entidade: 'Department',
      entidadeId: id,
      dadosAnteriores: {
        id: before.id,
        nome: before.nome,
        descricao: before.descricao,
        isActive: before.isActive,
      },
      dadosNovos: null,
      ipCliente: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
