import { ApiProperty } from '@nestjs/swagger';

export class DependencyDto {
  @ApiProperty({ example: '@nestjs/core' })
  readonly name: string;

  @ApiProperty({ example: '11.0.0' })
  readonly version: string;

  @ApiProperty({ example: 'MIT' })
  readonly license: string;

  constructor(data: DependencyDto) {
    this.name = data.name;
    this.version = data.version;
    this.license = data.license;
  }
}

export class SystemVersionDto {
  @ApiProperty({ example: 'GED Pro' })
  readonly appName: string;

  @ApiProperty({ example: '0.0.1' })
  readonly version: string;

  @ApiProperty({ example: 'development' })
  readonly environment: string;

  @ApiProperty({ example: '2026-05-21T00:00:00.000Z' })
  readonly buildDate: string;

  constructor(data: SystemVersionDto) {
    this.appName = data.appName;
    this.version = data.version;
    this.environment = data.environment;
    this.buildDate = data.buildDate;
  }
}

export class AdminSystemVersionDto extends SystemVersionDto {
  @ApiProperty({ example: 'v22.0.0' })
  readonly nodeVersion: string;

  @ApiProperty({ example: 'PostgreSQL 17.0' })
  readonly dbVersion: string;

  @ApiProperty({ example: 'online', enum: ['online', 'offline'] })
  readonly dbStatus: 'online' | 'offline';

  @ApiProperty({ example: 'online', enum: ['online', 'offline'] })
  readonly redisStatus: 'online' | 'offline';

  @ApiProperty({ type: [DependencyDto] })
  readonly dependencies: readonly DependencyDto[];

  constructor(data: AdminSystemVersionDto) {
    super(data);
    this.nodeVersion = data.nodeVersion;
    this.dbVersion = data.dbVersion;
    this.dbStatus = data.dbStatus;
    this.redisStatus = data.redisStatus;
    this.dependencies = data.dependencies;
  }
}
