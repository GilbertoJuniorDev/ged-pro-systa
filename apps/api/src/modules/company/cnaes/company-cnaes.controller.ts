import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CompanyCnaesService } from './company-cnaes.service';
import { UpsertCompanyCnaeDto } from './dto/upsert-company-cnae.dto';
import { CompanyCnaeResponseDto } from './dto/company-cnae-response.dto';

@ApiTags('company-cnaes')
@ApiBearerAuth()
@Controller('company/cnaes')
@UseGuards(JwtAuthGuard)
export class CompanyCnaesController {
  constructor(private readonly service: CompanyCnaesService) {}

  @Get()
  @ApiOperation({ summary: 'List all CNAEs of the singleton Company' })
  async list(): Promise<CompanyCnaeResponseDto[]> {
    const items = await this.service.findAll();
    return items.map((c) => new CompanyCnaeResponseDto(c));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new CNAE to the Company' })
  async create(
    @Body() dto: UpsertCompanyCnaeDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyCnaeResponseDto> {
    const created = await this.service.create(user.sub, dto);
    return new CompanyCnaeResponseDto(created);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiOperation({ summary: 'Update an existing Company CNAE' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCompanyCnaeDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyCnaeResponseDto> {
    const updated = await this.service.update(user.sub, id, dto);
    return new CompanyCnaeResponseDto(updated);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a Company CNAE' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.service.delete(user.sub, id);
  }
}
