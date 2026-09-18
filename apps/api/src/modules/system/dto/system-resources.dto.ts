import { ApiProperty } from '@nestjs/swagger';

export class CpuResourceDto {
  @ApiProperty({ example: 12.5, description: 'Uso de CPU agregado entre os núcleos (%)' })
  readonly usagePercent: number;

  @ApiProperty({ example: 8, description: 'Número de núcleos lógicos' })
  readonly cores: number;

  constructor(data: CpuResourceDto) {
    this.usagePercent = data.usagePercent;
    this.cores = data.cores;
  }
}

export class MemoryResourceDto {
  @ApiProperty({ example: 35.2 })
  readonly usagePercent: number;

  @ApiProperty({ example: 17179869184 })
  readonly totalBytes: number;

  @ApiProperty({ example: 6039797760 })
  readonly usedBytes: number;

  @ApiProperty({ example: 11140071424 })
  readonly freeBytes: number;

  constructor(data: MemoryResourceDto) {
    this.usagePercent = data.usagePercent;
    this.totalBytes = data.totalBytes;
    this.usedBytes = data.usedBytes;
    this.freeBytes = data.freeBytes;
  }
}

export class DiskResourceDto {
  @ApiProperty({ example: true, description: 'Se a métrica de disco pôde ser coletada neste ambiente' })
  readonly available: boolean;

  @ApiProperty({ example: 82.4, nullable: true })
  readonly usagePercent: number | null;

  @ApiProperty({ example: 512110190592, nullable: true })
  readonly totalBytes: number | null;

  @ApiProperty({ example: 421914521600, nullable: true })
  readonly usedBytes: number | null;

  constructor(data: DiskResourceDto) {
    this.available = data.available;
    this.usagePercent = data.usagePercent;
    this.totalBytes = data.totalBytes;
    this.usedBytes = data.usedBytes;
  }
}

export class SystemResourcesDto {
  @ApiProperty({ type: CpuResourceDto })
  readonly cpu: CpuResourceDto;

  @ApiProperty({ type: MemoryResourceDto })
  readonly memory: MemoryResourceDto;

  @ApiProperty({ type: DiskResourceDto })
  readonly disk: DiskResourceDto;

  constructor(data: SystemResourcesDto) {
    this.cpu = data.cpu;
    this.memory = data.memory;
    this.disk = data.disk;
  }
}
