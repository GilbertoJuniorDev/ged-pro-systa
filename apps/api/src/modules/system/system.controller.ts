import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ROLE } from '@ged/database';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SystemService } from './system.service';
import {
  SystemVersionDto,
  AdminSystemVersionDto,
} from './dto/system-version.dto';

@ApiTags('system')
@ApiBearerAuth()
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço disponível' })
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Get('version')
  @ApiOperation({ summary: 'Retorna a versão do sistema' })
  @ApiResponse({ status: 200, type: SystemVersionDto, description: 'Versão do sistema' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  getVersion(): SystemVersionDto {
    return this.systemService.getVersion();
  }

  @Get('version/admin')
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiOperation({ summary: 'Retorna informações técnicas completas do sistema (ADMIN)' })
  @ApiResponse({ status: 200, type: AdminSystemVersionDto, description: 'Informações técnicas completas' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado — requer ADMIN' })
  getAdminVersion(): Promise<AdminSystemVersionDto> {
    return this.systemService.getAdminVersion();
  }
}
