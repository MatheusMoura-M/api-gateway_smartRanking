import { iJogador } from 'src/jogadores/interfaces/jogador.interface';

export interface iPartida {
  categoria?: string;
  desafio?: string;
  jogadores?: iJogador[];
  def?: iJogador;
  resultado?: Resultado[];
}

export interface Resultado {
  set: string;
}
