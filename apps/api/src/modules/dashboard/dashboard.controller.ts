import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';
import { DashboardAdminSummaryResponseDto } from './dto/dashboard-admin-summary-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary scoped to the current user' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  async summary(@CurrentUser() user: JwtPayload): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(user);
  }

  @Get('admin-summary')
  @Roles(ROLE.ADMIN, ROLE.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin-only dashboard summary (departments, users)' })
  @ApiResponse({ status: 200, description: 'Admin dashboard summary retrieved successfully' })
  async adminSummary(): Promise<DashboardAdminSummaryResponseDto> {
    return this.dashboardService.getAdminSummary();
  }
}
