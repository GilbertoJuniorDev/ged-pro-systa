import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { SystemSettingsService } from './system-settings.service';

interface SystemSettingResponse {
  readonly key: string;
  readonly value: string | null;
}

@Controller('system-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemSettingsController {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  @Get(':key')
  @Permissions('SETTINGS_VIEW')
  async findOne(@Param('key') key: string): Promise<SystemSettingResponse> {
    const value = await this.systemSettingsService.get(key);
    return { key, value };
  }

  @Put(':key')
  @HttpCode(HttpStatus.OK)
  @Permissions('SETTINGS_EDIT')
  async update(
    @Param('key') key: string,
    @Body() body: UpdateSystemSettingDto,
  ): Promise<SystemSettingResponse> {
    const value = body.value ?? null;
    await this.systemSettingsService.set(key, value);
    return { key, value };
  }
}
