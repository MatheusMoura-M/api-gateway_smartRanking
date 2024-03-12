import { iJogador } from 'src/jogadores/interfaces/jogador.interface';
import { DesafioStatus } from '../desafio-status.enum';
import { iPartida } from './partida.interface';

export interface iDesafio {
  dataHoraDesafio: Date;
  status: DesafioStatus;
  dataHoraSolicitacao: Date;
  dataHoraResposta: Date;
  solicitante: iJogador;
  categoria: string;
  partida?: iPartida;
  jogadores: iJogador[];
}
