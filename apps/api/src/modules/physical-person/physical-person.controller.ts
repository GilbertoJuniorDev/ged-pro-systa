import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GENDER, ADDRESS_TYPE, PHONE_TYPE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PhysicalPersonService } from './physical-person.service';
import { CreatePhysicalPersonDto } from './dto/create-physical-person.dto';
import { UpdatePhysicalPersonDto } from './dto/update-physical-person.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CreatePhoneDto } from './dto/create-phone.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import {
  AddressResponseDto,
  PhysicalPersonResponseDto,
  PhoneResponseDto,
} from './dto/physical-person-response.dto';

@ApiTags('physical-person')
@ApiBearerAuth()
@Controller('users/:userId/physical-person')
@UseGuards(JwtAuthGuard)
export class PhysicalPersonController {
  constructor(private readonly physicalPersonService: PhysicalPersonService) {}

  // ── PhysicalPerson ────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get physical person profile' })
  async findOne(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PhysicalPersonResponseDto> {
    const pf = await this.physicalPersonService.findByUserId(userId);
    if (user.role !== 'ADMIN' && user.sub !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return new PhysicalPersonResponseDto({
      id: pf.id,
      userId: pf.userId,
      nome: pf.nome,
      sobrenome: pf.sobrenome,
      cpf: pf.cpf,
      dataNascimento: pf.dataNascimento,
      sexo: pf.sexo,
      createdAt: pf.createdAt,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create physical person profile' })
  async create(
    @Param('userId') userId: string,
    @Body() dto: CreatePhysicalPersonDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PhysicalPersonResponseDto> {
    const pf = await this.physicalPersonService.create(user.sub, user.role, userId, {
      userId,
      nome: dto.nome,
      sobrenome: dto.sobrenome,
      cpf: dto.cpf,
      dataNascimento: new Date(dto.dataNascimento),
      sexo: GENDER[dto.sexo as keyof typeof GENDER] ?? dto.sexo,
    });
    return new PhysicalPersonResponseDto({
      id: pf.id,
      userId: pf.userId,
      nome: pf.nome,
      sobrenome: pf.sobrenome,
      cpf: pf.cpf,
      dataNascimento: pf.dataNascimento,
      sexo: pf.sexo,
      createdAt: pf.createdAt,
    });
  }

  @Patch()
  @ApiOperation({ summary: 'Update physical person profile' })
  async update(
    @Param('userId') userId: string,
    @Body() dto: UpdatePhysicalPersonDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PhysicalPersonResponseDto> {
    const pf = await this.physicalPersonService.update(user.sub, user.role, userId, {
      nome: dto.nome,
      sobrenome: dto.sobrenome,
      dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
      sexo: dto.sexo,
    });
    return new PhysicalPersonResponseDto({
      id: pf.id,
      userId: pf.userId,
      nome: pf.nome,
      sobrenome: pf.sobrenome,
      cpf: pf.cpf,
      dataNascimento: pf.dataNascimento,
      sexo: pf.sexo,
      createdAt: pf.createdAt,
    });
  }

  // ── Addresses ────────────────────────────────────────────────────

  @Get('addresses')
  @ApiOperation({ summary: 'List addresses' })
  async findAddresses(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<AddressResponseDto[]> {
    const addresses = await this.physicalPersonService.findAddresses(user.sub, user.role, userId);
    return addresses.map((e) =>
      new AddressResponseDto({
        id: e.id,
        physicalPersonId: e.pessoaFisicaId ?? '',
        tipo: e.tipo,
        logradouro: e.logradouro,
        numero: e.numero,
        complemento: e.complemento,
        bairro: e.bairro,
        cidade: e.cidade,
        estado: e.estado,
        cep: e.cep,
        createdAt: e.createdAt,
      }),
    );
  }

  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an address' })
  async createAddress(
    @Param('userId') userId: string,
    @Body() dto: CreateAddressDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AddressResponseDto> {
    const e = await this.physicalPersonService.createAddress(user.sub, user.role, userId, {
      tipo: ADDRESS_TYPE[dto.tipo as keyof typeof ADDRESS_TYPE] ?? dto.tipo,
      logradouro: dto.logradouro,
      numero: dto.numero,
      complemento: dto.complemento ?? null,
      bairro: dto.bairro,
      cidade: dto.cidade,
      estado: dto.estado,
      cep: dto.cep,
    });
    return new AddressResponseDto({
      id: e.id,
      physicalPersonId: e.pessoaFisicaId ?? '',
      tipo: e.tipo,
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento,
      bairro: e.bairro,
      cidade: e.cidade,
      estado: e.estado,
      cep: e.cep,
      createdAt: e.createdAt,
    });
  }

  @Patch('addresses/:addressId')
  @ApiOperation({ summary: 'Update an address' })
  async updateAddress(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AddressResponseDto> {
    const e = await this.physicalPersonService.updateAddress(
      user.sub, user.role, userId, addressId, dto,
    );
    return new AddressResponseDto({
      id: e.id,
      physicalPersonId: e.pessoaFisicaId ?? '',
      tipo: e.tipo,
      logradouro: e.logradouro,
      numero: e.numero,
      complemento: e.complemento,
      bairro: e.bairro,
      cidade: e.cidade,
      estado: e.estado,
      cep: e.cep,
      createdAt: e.createdAt,
    });
  }

  @Delete('addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an address' })
  async removeAddress(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.physicalPersonService.removeAddress(user.sub, user.role, userId, addressId);
  }

  // ── Phones ────────────────────────────────────────────────────────

  @Get('phones')
  @ApiOperation({ summary: 'List phones' })
  async findPhones(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PhoneResponseDto[]> {
    const phones = await this.physicalPersonService.findPhones(user.sub, user.role, userId);
    return phones.map((t) =>
      new PhoneResponseDto({
        id: t.id,
        physicalPersonId: t.pessoaFisicaId ?? '',
        tipo: t.tipo,
        numero: t.numero,
        createdAt: t.createdAt,
      }),
    );
  }

  @Post('phones')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a phone' })
  async createPhone(
    @Param('userId') userId: string,
    @Body() dto: CreatePhoneDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PhoneResponseDto> {
    const t = await this.physicalPersonService.createPhone(user.sub, user.role, userId, {
      tipo: PHONE_TYPE[dto.tipo as keyof typeof PHONE_TYPE] ?? dto.tipo,
      numero: dto.numero,
    });
    return new PhoneResponseDto({
      id: t.id,
      physicalPersonId: t.pessoaFisicaId ?? '',
      tipo: t.tipo,
      numero: t.numero,
      createdAt: t.createdAt,
    });
  }

  @Patch('phones/:phoneId')
  @ApiOperation({ summary: 'Update a phone' })
  async updatePhone(
    @Param('userId') userId: string,
    @Param('phoneId') phoneId: string,
    @Body() dto: UpdatePhoneDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PhoneResponseDto> {
    const t = await this.physicalPersonService.updatePhone(
      user.sub, user.role, userId, phoneId, dto,
    );
    return new PhoneResponseDto({
      id: t.id,
      physicalPersonId: t.pessoaFisicaId ?? '',
      tipo: t.tipo,
      numero: t.numero,
      createdAt: t.createdAt,
    });
  }

  @Delete('phones/:phoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a phone' })
  async removePhone(
    @Param('userId') userId: string,
    @Param('phoneId') phoneId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.physicalPersonService.removePhone(user.sub, user.role, userId, phoneId);
  }
}

