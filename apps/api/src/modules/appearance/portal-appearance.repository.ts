import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortalAppearance } from '@ged/database';
import type {
  IPortalAppearanceRepository,
  UpdatePortalAppearanceData,
  UpdatePortalAppearanceLogoData,
} from './interfaces/portal-appearance-repository.interface';

@Injectable()
export class PortalAppearanceRepository implements IPortalAppearanceRepository {
  constructor(
    @InjectRepository(PortalAppearance)
    private readonly repo: Repository<PortalAppearance>,
  ) {}

  async findSingleton(): Promise<PortalAppearance> {
    return this.repo.findOneOrFail({ where: {} });
  }

  async update(data: UpdatePortalAppearanceData): Promise<PortalAppearance> {
    const existing = await this.findSingleton();
    await this.repo.update(existing.id, {
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      backgroundColor: data.backgroundColor,
      heroTitle: data.heroTitle,
      heroSubtitle: data.heroSubtitle,
      footerMessage: data.footerMessage,
      useDefaultTheme: data.useDefaultTheme,
    });
    return this.repo.findOneOrFail({ where: { id: existing.id } });
  }

  async updateLogo(data: UpdatePortalAppearanceLogoData): Promise<PortalAppearance> {
    const existing = await this.findSingleton();
    await this.repo.update(existing.id, {
      logoPath: data.logoPath,
      logoMimeType: data.logoMimeType,
      logoVersion: data.logoVersion,
    });
    return this.repo.findOneOrFail({ where: { id: existing.id } });
  }
}
