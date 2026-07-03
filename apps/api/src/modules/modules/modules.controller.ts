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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ROLE } from '@ged/database';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ModuleResponseDto } from './dto/module-response.dto';

@ApiTags('modules')
@ApiBearerAuth()
@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.SUPER_ADMIN)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  @ApiOperation({ summary: 'List all modules' })
  @ApiResponse({ status: 200, description: 'Modules listed successfully' })
  async findAll(): Promise<ModuleResponseDto[]> {
    const modules = await this.modulesService.findAll();
    return modules.map((m) => new ModuleResponseDto(m));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get module by ID' })
  @ApiResponse({ status: 200, description: 'Module found' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async findOne(@Param('id') id: string): Promise<ModuleResponseDto> {
    const module = await this.modulesService.findById(id);
    return new ModuleResponseDto(module);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new module' })
  @ApiResponse({ status: 201, description: 'Module created successfully' })
  @ApiResponse({ status: 409, description: 'Module name or slug already exists' })
  async create(@Body() dto: CreateModuleDto): Promise<ModuleResponseDto> {
    const module = await this.modulesService.create(dto);
    return new ModuleResponseDto(module);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a module' })
  @ApiResponse({ status: 200, description: 'Module updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateModuleDto,
  ): Promise<ModuleResponseDto> {
    const module = await this.modulesService.update(id, dto);
    return new ModuleResponseDto(module);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a module' })
  @ApiResponse({ status: 204, description: 'Module deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.modulesService.remove(id);
  }
}
