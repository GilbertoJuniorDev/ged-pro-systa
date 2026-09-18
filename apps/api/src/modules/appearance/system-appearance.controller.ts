import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { JwtPayload } from '@ged/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemAppearanceService } from './system-appearance.service';
import { UpdateSystemAppearanceDto } from './dto/update-system-appearance.dto';
import { SystemAppearanceResponseDto } from './dto/system-appearance-response.dto';

// Multer decorators evaluate at class-definition time (before Nest DI is up), so this
// reads BRANDING_LOGO_MAX_SIZE directly from process.env rather than via ConfigService
// (mesmo padrão de MAX_FILE_SIZE em documents.controller.ts).
const MAX_LOGO_SIZE = Number(process.env['BRANDING_LOGO_MAX_SIZE']) || 2_097_152;
// SVG deliberadamente fora da whitelist: risco de XSS via <script>/onload embutido
// num arquivo que é servido publicamente e sem sanitização.
const ALLOWED_LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

@ApiTags('appearance')
@ApiBearerAuth()
@Controller('admin/appearance/system')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemAppearanceController {
  constructor(private readonly systemAppearanceService: SystemAppearanceService) {}

  @Get()
  @Permissions('SETTINGS_VIEW')
  @ApiOperation({ summary: 'Obter a aparência do sistema (cores + logo)' })
  async findOne(): Promise<SystemAppearanceResponseDto> {
    const setting = await this.systemAppearanceService.getSingleton();
    return this.toResponse(setting);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @Permissions('SETTINGS_EDIT')
  @ApiOperation({ summary: 'Atualizar a paleta de cores do sistema' })
  async update(
    @Body() dto: UpdateSystemAppearanceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SystemAppearanceResponseDto> {
    const setting = await this.systemAppearanceService.updateColors(user.sub, dto);
    return this.toResponse(setting);
  }

  @Post('logo')
  @HttpCode(HttpStatus.OK)
  @Permissions('SETTINGS_EDIT')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOGO_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_LOGO_MIME_TYPES.includes(file.mimetype)) {
          callback(new BadRequestException('Tipo de arquivo não permitido'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Enviar o logo do sistema' })
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<SystemAppearanceResponseDto> {
    if (!file) throw new BadRequestException('Arquivo é obrigatório');
    const setting = await this.systemAppearanceService.uploadLogo(user.sub, file);
    return this.toResponse(setting);
  }

  @Delete('logo')
  @HttpCode(HttpStatus.OK)
  @Permissions('SETTINGS_EDIT')
  @ApiOperation({ summary: 'Remover o logo do sistema (volta ao logo padrão)' })
  async deleteLogo(@CurrentUser() user: JwtPayload): Promise<SystemAppearanceResponseDto> {
    const setting = await this.systemAppearanceService.deleteLogo(user.sub);
    return this.toResponse(setting);
  }

  private toResponse(setting: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    useDefaultTheme: boolean;
    logoPath: string | null;
    logoVersion: number;
    updatedAt: Date;
  }): SystemAppearanceResponseDto {
    return new SystemAppearanceResponseDto({
      primaryColor: setting.primaryColor,
      secondaryColor: setting.secondaryColor,
      backgroundColor: setting.backgroundColor,
      useDefaultTheme: setting.useDefaultTheme,
      hasLogo: setting.logoPath !== null,
      logoVersion: setting.logoVersion,
      updatedAt: setting.updatedAt,
    });
  }
}
