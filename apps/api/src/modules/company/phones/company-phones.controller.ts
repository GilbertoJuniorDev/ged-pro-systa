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
import { CompanyPhonesService } from './company-phones.service';
import { UpsertCompanyPhoneDto } from './dto/upsert-company-phone.dto';
import { CompanyPhoneResponseDto } from './dto/company-phone-response.dto';

@ApiTags('company-phones')
@ApiBearerAuth()
@Controller('company/phones')
@UseGuards(JwtAuthGuard)
export class CompanyPhonesController {
  constructor(private readonly service: CompanyPhonesService) {}

  @Get()
  @ApiOperation({ summary: 'List all phones of the singleton Company' })
  async list(): Promise<CompanyPhoneResponseDto[]> {
    const items = await this.service.findAll();
    return items.map((p) => new CompanyPhoneResponseDto(p));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new phone to the Company' })
  async create(
    @Body() dto: UpsertCompanyPhoneDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyPhoneResponseDto> {
    const created = await this.service.create(user.sub, dto);
    return new CompanyPhoneResponseDto(created);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiOperation({ summary: 'Update an existing Company phone' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCompanyPhoneDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyPhoneResponseDto> {
    const updated = await this.service.update(user.sub, id, dto);
    return new CompanyPhoneResponseDto(updated);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a Company phone' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.service.delete(user.sub, id);
  }
}
