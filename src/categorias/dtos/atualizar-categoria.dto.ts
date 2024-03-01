import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';
import { iEvento } from './criar-categoria.dto';

export class AtualizarCategoriaDto {
  @IsString()
  @IsOptional()
  descricao: string;

  @IsArray()
  @ArrayMinSize(1)
  eventos: Array<iEvento>;
}
