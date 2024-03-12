import { IsNotEmpty } from 'class-validator';
import { iJogador } from '../../jogadores/interfaces/jogador.interface';
import { Resultado } from '../interfaces/partida.interface';

export class AtribuirDesafioPartidaDto {
  @IsNotEmpty()
  def: iJogador;

  @IsNotEmpty()
  resultado: Resultado[];
}
