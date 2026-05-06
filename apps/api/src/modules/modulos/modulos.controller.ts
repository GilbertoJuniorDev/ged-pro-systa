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
  UseGuards,
} from '@nestjs/common';
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ModulosService } from './modulos.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { ModuloResponseDto } from './dto/modulo-response.dto';

@Controller('modulos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.ADMIN)
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  @Get()
  async findAll(): Promise<ModuloResponseDto[]> {
    const modulos = await this.modulosService.findAll();
    return modulos.map((m) => new ModuloResponseDto(m));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ModuloResponseDto> {
    const modulo = await this.modulosService.findById(id);
    return new ModuloResponseDto(modulo);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateModuloDto): Promise<ModuloResponseDto> {
    const modulo = await this.modulosService.create(dto);
    return new ModuloResponseDto(modulo);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateModuloDto,
  ): Promise<ModuloResponseDto> {
    const modulo = await this.modulosService.update(id, dto);
    return new ModuloResponseDto(modulo);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.modulosService.remove(id);
  }
}
