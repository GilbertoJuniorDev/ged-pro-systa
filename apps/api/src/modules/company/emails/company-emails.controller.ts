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
import { CompanyEmailsService } from './company-emails.service';
import { UpsertCompanyEmailDto } from './dto/upsert-company-email.dto';
import { CompanyEmailResponseDto } from './dto/company-email-response.dto';

@ApiTags('company-emails')
@ApiBearerAuth()
@Controller('company/emails')
@UseGuards(JwtAuthGuard)
export class CompanyEmailsController {
  constructor(private readonly service: CompanyEmailsService) {}

  @Get()
  @ApiOperation({ summary: 'List all e-mails of the singleton Company' })
  async list(): Promise<CompanyEmailResponseDto[]> {
    const items = await this.service.findAll();
    return items.map((e) => new CompanyEmailResponseDto(e));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new e-mail to the Company' })
  async create(
    @Body() dto: UpsertCompanyEmailDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyEmailResponseDto> {
    const created = await this.service.create(user.sub, dto);
    return new CompanyEmailResponseDto(created);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @ApiOperation({ summary: 'Update an existing Company e-mail' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertCompanyEmailDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CompanyEmailResponseDto> {
    const updated = await this.service.update(user.sub, id, dto);
    return new CompanyEmailResponseDto(updated);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a Company e-mail' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.service.delete(user.sub, id);
  }
}
