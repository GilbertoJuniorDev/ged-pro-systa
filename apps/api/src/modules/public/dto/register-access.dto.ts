import {
  IsEmail,
  IsIn,
  IsString,
  Length,
  Validate,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { TIPO_DOCUMENTO } from '@ged/database';
import type { TipoDocumento } from '@ged/types';
import { isValidCnpj, isValidCpf } from '@ged/utils';

// Validador cruzado: o dígito verificador exigido depende do campo `tipoDocumento` do
// mesmo DTO. `args.object` é sempre a instância de RegisterAccessDto sendo validada — é
// o próprio class-validator quem popula esse valor ao rodar a constraint, então o cast é
// seguro (não é uma suposição não verificada sobre um valor externo).
@ValidatorConstraint({ name: 'documentoValidoParaTipo', async: false })
class DocumentoValidoParaTipoConstraint implements ValidatorConstraintInterface {
  validate(documento: unknown, args: ValidationArguments): boolean {
    if (typeof documento !== 'string') return false;
    const { tipoDocumento } = args.object as RegisterAccessDto;
    if (tipoDocumento === TIPO_DOCUMENTO.CPF) return isValidCpf(documento);
    if (tipoDocumento === TIPO_DOCUMENTO.CNPJ) return isValidCnpj(documento);
    // tipoDocumento fora de CPF/CNPJ já é rejeitado pelo @IsIn no próprio campo; aqui só
    // evitamos aceitar um documento quando o tipo não é reconhecível.
    return false;
  }

  defaultMessage(): string {
    return 'documento inválido para o tipoDocumento informado';
  }
}

export class RegisterAccessDto {
  @IsEmail()
  readonly email!: string;

  @IsString()
  @Length(2, 200)
  readonly nome!: string;

  @IsString()
  @Validate(DocumentoValidoParaTipoConstraint)
  readonly documento!: string;

  @IsIn(Object.values(TIPO_DOCUMENTO))
  readonly tipoDocumento!: TipoDocumento;
}
