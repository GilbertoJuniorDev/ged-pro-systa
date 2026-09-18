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
import { PortalAppearanceService } from './portal-appearance.service';
import { UpdatePortalAppearanceDto } from './dto/update-portal-appearance.dto';
import { PortalAppearanceResponseDto } from './dto/portal-appearance-response.dto';

// Ver system-appearance.controller.ts — mesmo motivo para ler direto de process.env.
const MAX_LOGO_SIZE = Number(process.env['BRANDING_LOGO_MAX_SIZE']) || 2_097_152;
const ALLOWED_LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

@ApiTags('appearance')
@ApiBearerAuth()
@Controller('admin/appearance/portal')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PortalAppearanceController {
  constructor(private readonly portalAppearanceService: PortalAppearanceService) {}

  @Get()
  @Permissions('SETTINGS_VIEW')
  @ApiOperation({ summary: 'Obter a aparência do portal público (cores + logo + textos)' })
  async findOne(): Promise<PortalAppearanceResponseDto> {
    const setting = await this.portalAppearanceService.getSingleton();
    return this.toResponse(setting);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @Permissions('SETTINGS_EDIT')
  @ApiOperation({ summary: 'Atualizar cores e textos do portal público' })
  async update(
    @Body() dto: UpdatePortalAppearanceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PortalAppearanceResponseDto> {
    const setting = await this.portalAppearanceService.update(user.sub, dto);
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
  @ApiOperation({ summary: 'Enviar o logo do portal público' })
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<PortalAppearanceResponseDto> {
    if (!file) throw new BadRequestException('Arquivo é obrigatório');
    const setting = await this.portalAppearanceService.uploadLogo(user.sub, file);
    return this.toResponse(setting);
  }

  @Delete('logo')
  @HttpCode(HttpStatus.OK)
  @Permissions('SETTINGS_EDIT')
  @ApiOperation({ summary: 'Remover o logo do portal público (volta ao logo padrão)' })
  async deleteLogo(@CurrentUser() user: JwtPayload): Promise<PortalAppearanceResponseDto> {
    const setting = await this.portalAppearanceService.deleteLogo(user.sub);
    return this.toResponse(setting);
  }

  private toResponse(setting: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    logoPath: string | null;
    logoVersion: number;
    heroTitle: string;
    heroSubtitle: string;
    footerMessage: string;
    updatedAt: Date;
  }): PortalAppearanceResponseDto {
    return new PortalAppearanceResponseDto({
      primaryColor: setting.primaryColor,
      secondaryColor: setting.secondaryColor,
      backgroundColor: setting.backgroundColor,
      hasLogo: setting.logoPath !== null,
      logoVersion: setting.logoVersion,
      heroTitle: setting.heroTitle,
      heroSubtitle: setting.heroSubtitle,
      footerMessage: setting.footerMessage,
      updatedAt: setting.updatedAt,
    });
  }
}
