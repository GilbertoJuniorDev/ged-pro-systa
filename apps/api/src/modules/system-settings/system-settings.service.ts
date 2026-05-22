import { Injectable } from '@nestjs/common';
import { SystemSettingsRepository } from './system-settings.repository';

export const SYSTEM_SETTING_KEYS = {
  ERROR_ALERT_EMAIL: 'error_alert_email',
} as const;

interface CacheEntry {
  value: string | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;

@Injectable()
export class SystemSettingsService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly systemSettingsRepository: SystemSettingsRepository,
  ) {}

  async get(key: string): Promise<string | null> {
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const setting = await this.systemSettingsRepository.findByKey(key);
    const value = setting?.value ?? null;

    this.cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });

    return value;
  }

  async set(key: string, value: string | null): Promise<void> {
    await this.systemSettingsRepository.upsert(key, value);
    this.cache.delete(key);
  }
}
