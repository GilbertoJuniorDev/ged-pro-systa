import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppearanceSetting } from '@ged/database';
import type {
  ISystemAppearanceRepository,
  UpdateSystemAppearanceColorsData,
  UpdateSystemAppearanceLogoData,
} from './interfaces/system-appearance-repository.interface';

@Injectable()
export class SystemAppearanceRepository implements ISystemAppearanceRepository {
  constructor(
    @InjectRepository(AppearanceSetting)
    private readonly repo: Repository<AppearanceSetting>,
  ) {}

  async findSingleton(): Promise<AppearanceSetting> {
    return this.repo.findOneOrFail({ where: {} });
  }

  async updateColors(data: UpdateSystemAppearanceColorsData): Promise<AppearanceSetting> {
    const existing = await this.findSingleton();
    await this.repo.update(existing.id, {
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      backgroundColor: data.backgroundColor,
    });
    return this.repo.findOneOrFail({ where: { id: existing.id } });
  }

  async updateLogo(data: UpdateSystemAppearanceLogoData): Promise<AppearanceSetting> {
    const existing = await this.findSingleton();
    await this.repo.update(existing.id, {
      logoPath: data.logoPath,
      logoMimeType: data.logoMimeType,
      logoVersion: data.logoVersion,
    });
    return this.repo.findOneOrFail({ where: { id: existing.id } });
  }
}
