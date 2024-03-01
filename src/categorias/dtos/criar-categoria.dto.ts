import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export interface iEvento {
  nome: string;
  operacao: string;
  valor: number;
}

export class CriarCategoriaDto {
  @IsString()
  @IsNotEmpty()
  readonly categoria: string;

  @IsString()
  @IsNotEmpty()
  readonly descricao: string;

  @IsArray()
  @ArrayMinSize(1)
  readonly eventos: Array<iEvento>;
}
