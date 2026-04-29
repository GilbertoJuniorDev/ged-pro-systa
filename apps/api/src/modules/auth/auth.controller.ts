import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '@ged/types';

@ApiTags('auth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuário e obter tokens JWT' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.login(user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar par de tokens via refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  async refresh(@Body() dto: RefreshTokenDto) {
    // O JWT_REFRESH_SECRET é validado pelo JwtRefreshStrategy; aqui é uma rota pública
    // que recebe o refreshToken no body e delega ao service.
    // Precisamos decodificar o sub sem verificar via guard, então o service faz isso.
    const decoded = this.authService['jwtService'].decode(dto.refreshToken) as {
      sub?: string;
    } | null;

    if (!decoded?.sub) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    return this.authService.refreshTokens(decoded.sub, dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Encerrar sessão e invalidar refresh token' })
  @ApiResponse({ status: 204, description: 'Logout realizado com sucesso' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(user.sub, dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retornar dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário autenticado' })
  me(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }
}
