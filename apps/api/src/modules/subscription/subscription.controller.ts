import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';
import { UpsertSubscriptionDto } from './dto/upsert-subscription.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionPaymentResponseDto } from './dto/subscription-payment-response.dto';

@ApiTags('subscription')
@ApiBearerAuth()
@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get the singleton Subscription' })
  async findOne(): Promise<SubscriptionResponseDto> {
    const sub = await this.subscriptionService.getSingleton();
    return new SubscriptionResponseDto(sub);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create or update the singleton Subscription' })
  async upsert(
    @Body() dto: UpsertSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SubscriptionResponseDto> {
    const sub = await this.subscriptionService.upsert(user.sub, {
      status: dto.status,
      planName: dto.planName ?? null,
      valor: dto.valor,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      nextBillingDate: dto.nextBillingDate ? new Date(dto.nextBillingDate) : null,
      notes: dto.notes ?? null,
    });
    return new SubscriptionResponseDto(sub);
  }

  @Post('suspend')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend subscription' })
  async suspend(@CurrentUser() user: JwtPayload): Promise<SubscriptionResponseDto> {
    return new SubscriptionResponseDto(await this.subscriptionService.suspend(user.sub));
  }

  @Post('reactivate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reactivate subscription' })
  async reactivate(
    @CurrentUser() user: JwtPayload,
  ): Promise<SubscriptionResponseDto> {
    return new SubscriptionResponseDto(await this.subscriptionService.reactivate(user.sub));
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancel(@CurrentUser() user: JwtPayload): Promise<SubscriptionResponseDto> {
    return new SubscriptionResponseDto(await this.subscriptionService.cancel(user.sub));
  }

  @Post('record-payment')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register a payment' })
  async recordPayment(
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SubscriptionResponseDto> {
    const sub = await this.subscriptionService.recordPayment(
      user.sub,
      new Date(dto.paidAt),
      dto.nextBillingDate ? new Date(dto.nextBillingDate) : null,
    );
    return new SubscriptionResponseDto(sub);
  }

  @Get('payments')
  @UseGuards(RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all recorded payments' })
  async listPayments(): Promise<SubscriptionPaymentResponseDto[]> {
    const sub = await this.subscriptionService.getSingleton();
    const payments = await this.subscriptionService.listPayments(sub.id);
    return payments.map((p) => new SubscriptionPaymentResponseDto(p));
  }
}
