import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@ged.local' })
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ example: 'senha-super-secreta' })
  @IsString()
  @MinLength(8)
  readonly password!: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  readonly rememberMe?: boolean;
}
