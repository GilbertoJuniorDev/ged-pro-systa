import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload, MeResponseDto } from '@ged/types';
import { UserPermissionsService } from '../user-permissions/user-permissions.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@ApiTags('auth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userPermissionsService: UserPermissionsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuário e obter tokens JWT' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Req() req: HttpRequest, @Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const result = await this.authService.login(user);
    void this.auditLogsService.log({
      usuarioId: user.id,
      acao: 'LOGIN',
      entidade: 'User',
      entidadeId: user.id,
      ipCliente: req.ip ?? null,
      userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
    });
    return result;
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
    @Req() req: HttpRequest,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(user.sub, dto.refreshToken);
    void this.auditLogsService.log({
      usuarioId: user.sub,
      acao: 'LOGOUT',
      entidade: 'User',
      entidadeId: user.sub,
      ipCliente: req.ip ?? null,
      userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
    });
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retornar dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário autenticado' })
  async me(@CurrentUser() user: JwtPayload): Promise<MeResponseDto> {
    const ups = await this.userPermissionsService.findByUserId(user.sub);

    const permissoes = ups
      .map((up) => (up as unknown as { permissao?: { nome?: string } }).permissao?.nome)
      .filter((nome): nome is string => typeof nome === 'string');

    const moduloSlugs = [
      ...new Set(
        ups
          .map(
            (up) =>
              (up as unknown as { permissao?: { modulo?: { slug?: string } } }).permissao?.modulo
                ?.slug,
          )
          .filter((slug): slug is string => typeof slug === 'string'),
      ),
    ];

    return { ...user, permissoes, modulos: moduloSlugs };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar redefinição de senha por e-mail' })
  @ApiResponse({
    status: 200,
    description:
      'Se o e-mail estiver cadastrado, um link de redefinição será enviado',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return {
      message:
        'Se o e-mail informado estiver cadastrado, você receberá as instruções em breve.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha usando o token recebido por e-mail' })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Senha redefinida com sucesso.' };
  }
}
