import { Controller, Get, NotFoundException, Res, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Readable } from 'node:stream';
import type { Response } from 'express';
import type { PortalAppearanceDto, SystemAppearanceDto } from '@ged/types';
import { Public } from '../../common/decorators/public.decorator';
import { SystemAppearanceService } from '../appearance/system-appearance.service';
import { PortalAppearanceService } from '../appearance/portal-appearance.service';

// Leitura de configuração é generosa (renderizada em toda navegação de login/portal).
const APPEARANCE_THROTTLE = { default: { limit: 30, ttl: 60_000 } };
// Binário do logo é servido sempre com `?v=<logoVersion>` (cache-busting) — o navegador
// já resolve a maior parte das repetições via Cache-Control, então pode ser mais generoso.
const LOGO_THROTTLE = { default: { limit: 60, ttl: 60_000 } };

interface LogoFile {
  readonly stream: NodeJS.ReadableStream;
  readonly mimeType: string;
}

@ApiTags('public-appearance')
@Controller('public/appearance')
export class PublicAppearanceController {
  constructor(
    private readonly systemAppearanceService: SystemAppearanceService,
    private readonly portalAppearanceService: PortalAppearanceService,
  ) {}

  @Public()
  @Throttle(APPEARANCE_THROTTLE)
  @Get('system')
  @ApiOperation({ summary: 'Aparência do sistema (cores + logo) — leitura anônima para o login' })
  async system(): Promise<SystemAppearanceDto> {
    const setting = await this.systemAppearanceService.getEffectiveAppearance();
    return {
      primaryColor: setting.primaryColor,
      secondaryColor: setting.secondaryColor,
      backgroundColor: setting.backgroundColor,
      hasLogo: setting.logoPath !== null,
      logoVersion: setting.logoVersion,
      updatedAt: setting.updatedAt.toISOString(),
    };
  }

  @Public()
  @Throttle(LOGO_THROTTLE)
  @Get('system/logo')
  @ApiOperation({ summary: 'Binário do logo do sistema' })
  @ApiResponse({ status: 404, description: 'Nenhum logo configurado' })
  async systemLogo(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const file = await this.systemAppearanceService.getLogoFile();
    return streamLogo(file, res);
  }

  @Public()
  @Throttle(APPEARANCE_THROTTLE)
  @Get('portal')
  @ApiOperation({ summary: 'Aparência do portal público (cores + logo + textos)' })
  async portal(): Promise<PortalAppearanceDto> {
    const setting = await this.portalAppearanceService.getEffectiveAppearance();
    return {
      primaryColor: setting.primaryColor,
      secondaryColor: setting.secondaryColor,
      backgroundColor: setting.backgroundColor,
      hasLogo: setting.logoPath !== null,
      logoVersion: setting.logoVersion,
      heroTitle: setting.heroTitle,
      heroSubtitle: setting.heroSubtitle,
      footerMessage: setting.footerMessage,
      updatedAt: setting.updatedAt.toISOString(),
    };
  }

  @Public()
  @Throttle(LOGO_THROTTLE)
  @Get('portal/logo')
  @ApiOperation({ summary: 'Binário do logo do portal público' })
  @ApiResponse({ status: 404, description: 'Nenhum logo configurado' })
  async portalLogo(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const file = await this.portalAppearanceService.getLogoFile();
    return streamLogo(file, res);
  }
}

function streamLogo(file: LogoFile | null, res: Response): StreamableFile {
  if (!file) {
    throw new NotFoundException('Nenhum logo configurado');
  }
  // A URL é sempre montada com `?v=<logoVersion>` (cache-busting) pelo frontend —
  // uma vez publicada, aquela versão nunca muda, então pode ser cacheada indefinidamente.
  res.set({
    'Content-Type': file.mimeType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  return new StreamableFile(file.stream as Readable);
}
