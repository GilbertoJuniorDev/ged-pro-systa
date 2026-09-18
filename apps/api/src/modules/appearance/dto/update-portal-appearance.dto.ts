import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AppearanceColorsDto } from './appearance-colors.dto';

// `@IsNotEmpty` em todos os textos: são renderizados no portal PÚBLICO, e uma string
// vazia deixaria o hero ou o rodapé sem conteúdo para qualquer visitante. O Zod do
// formulário já exige min(1) -- isto fecha o mesmo contrato do lado da API (Fail Fast),
// para o caso de uma chamada direta ao endpoint.
export class UpdatePortalAppearanceDto extends AppearanceColorsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  readonly heroTitle!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  readonly heroSubtitle!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  readonly footerMessage!: string;
}
