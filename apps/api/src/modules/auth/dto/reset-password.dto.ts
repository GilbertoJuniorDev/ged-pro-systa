import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recebido no e-mail (64 chars hex)' })
  @IsString()
  @MinLength(64)
  readonly token!: string;

  @ApiProperty({
    description:
      'Nova senha — mínimo 8 caracteres, ao menos 1 maiúscula, 1 minúscula e 1 número',
    example: 'NovaS3nha!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'A senha deve conter ao menos uma letra maiúscula, uma minúscula e um número',
  })
  readonly newPassword!: string;
}
