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
import { CompanyAddressesService } from './company-addresses.service';
import { UpsertCompanyAddressDto } from './dto/upsert-company-address.dto';
import { CompanyAddressResponseDto } from './dto/company-address-response.dto';

@ApiTags('company-addresses')
@ApiBearerAuth()
@Controller('company/addresses')
@UseGuards(JwtAuthGuard)
export class CompanyAddressesController {
  constructor(private readonly service: CompanyAddressesService) {}

  @Get()
  @ApiOperation({ summary: 'List all addresses of the singleton Company' })
  async list(): Promise<CompanyAddressResponseDto[]> {
    const items = await this.service.findAll();
    return items.map((a) => new CompanyAddressResponseDto(a));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new address to the Company' })
  async create(
    @Body() dto: UpsertCompanyAddressDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyAddressResponseDto> {
    const created = await this.service.create(user.sub, dto);
    return new CompanyAddressResponseDto(created);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiOperation({ summary: 'Update an existing Company address' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCompanyAddressDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyAddressResponseDto> {
    const updated = await this.service.update(user.sub, id, dto);
    return new CompanyAddressResponseDto(updated);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a Company address' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.service.delete(user.sub, id);
  }
}
