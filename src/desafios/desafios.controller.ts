import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Get,
  Query,
  Put,
  Param,
  Delete,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CriarDesafioDto } from './dtos/criar-desafio.dto';
import { DesafioStatusValidacaoPipe } from './pipes/desafio-status-validation.pipe';
import { AtribuirDesafioPartidaDto } from './dtos/atribuir-desafio-partida.dto';
import { AtualizarDesafioDto } from './dtos/atualizar-desafio.dto';
import { ClientProxySmartRanking } from '../proxyrmq/client-proxy';
import { iJogador } from '../jogadores/interfaces/jogador.interface';
import { iDesafio } from '../desafios/interfaces/desafio.interface';
import { DesafioStatus } from './desafio-status.enum';
import { iPartida } from './interfaces/partida.interface';
import { lastValueFrom } from 'rxjs';

@Controller('api/v1/desafios')
export class DesafiosController {
  constructor(private clientProxySmartRanking: ClientProxySmartRanking) {}

  private readonly logger = new Logger(DesafiosController.name);

  private clientDesafios =
    this.clientProxySmartRanking.getClientProxyDesafiosInstance();

  private clientAdminBackend =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  @Post()
  @UsePipes(ValidationPipe)
  async criarDesafio(@Body() criarDesafioDto: CriarDesafioDto) {
    this.logger.log(`criarDesafioDto: ${JSON.stringify(criarDesafioDto)}`);

    /*
        Validações relacionadas ao array de jogadores que participam
        do desafio
    */
    const jogadores: iJogador[] = await lastValueFrom(
      this.clientAdminBackend.send('consultar-jogadores', ''),
    );

    criarDesafioDto.jogadores.map((jogadorDto) => {
      const jogadorFilter: iJogador[] = jogadores.filter(
        (jogador) => jogador._id == jogadorDto._id,
      );

      this.logger.log(`jogadorFilter: ${JSON.stringify(jogadorFilter)}`);

      /*
        Verificamos se os jogadores do desafio estão cadastrados
      */
      if (jogadorFilter.length == 0) {
        throw new BadRequestException(
          `O id ${jogadorDto._id} não é um jogador!`,
        );
      }

      /*
        Verificar se os jogadores fazem parte da categoria informada no
        desafio 
      */
      if (jogadorFilter[0].categoria != criarDesafioDto.categoria) {
        throw new BadRequestException(
          `O jogador ${jogadorFilter[0]._id} não faz parte da categoria informada!`,
        );
      }
    });

    /*
        Verificamos se o solicitante é um jogador da partida
    */
    const solicitanteEhJogadorDaPartida: iJogador[] =
      criarDesafioDto.jogadores.filter(
        (jogador) => jogador._id == criarDesafioDto.solicitante,
      );

    this.logger.log(
      `solicitanteEhJogadorDaPartida: ${JSON.stringify(solicitanteEhJogadorDaPartida)}`,
    );

    if (solicitanteEhJogadorDaPartida.length == 0) {
      throw new BadRequestException(
        `O solicitante deve ser um jogador da partida!`,
      );
    }

    /*
        Verificamos se a categoria está cadastrada
    */
    const categoria = await lastValueFrom(
      this.clientAdminBackend.send(
        'consultar-categorias',
        criarDesafioDto.categoria,
      ),
    );

    this.logger.log(`categoria: ${JSON.stringify(categoria)}`);

    if (!categoria) {
      throw new BadRequestException(`Categoria informada não existe!`);
    }

    this.clientDesafios.emit('criar-desafio', criarDesafioDto);
  }

  @Get()
  async consultarDesafios(@Query('idJogador') idJogador: string): Promise<any> {
    if (idJogador) {
      const jogador: iJogador = await lastValueFrom(
        this.clientAdminBackend.send('consultar-jogadores', idJogador),
      );

      if (!jogador) {
        throw new BadRequestException(`Jogador não cadastrado!`);
      }
    }

    return await lastValueFrom(
      this.clientDesafios.send('consultar-desafios', {
        idJogador: idJogador,
        _id: '',
      }),
    );
  }

  @Put('/:desafio')
  async atualizarDesafio(
    @Body(DesafioStatusValidacaoPipe) atualizarDesafioDto: AtualizarDesafioDto,
    @Param('desafio') _id: string,
  ) {
    const desafio: iDesafio = await lastValueFrom(
      this.clientDesafios.send('consultar-desafios', {
        idJogador: '',
        _id: _id,
      }),
    );

    this.logger.log(`desafio: ${JSON.stringify(desafio)}`);

    if (!desafio) {
      throw new BadRequestException(`Desafio não cadastrado!`);
    }

    if (desafio.status != DesafioStatus.PENDENTE) {
      throw new BadRequestException(
        'Somente desafios com status PENDENTE podem ser atualizados!',
      );
    }

    this.clientDesafios.emit('atualizar-desafio', {
      id: _id,
      desafio: atualizarDesafioDto,
    });
  }

  @Post('/:desafio/partida/')
  async atribuirDesafioPartida(
    @Body(ValidationPipe) atribuirDesafioPartidaDto: AtribuirDesafioPartidaDto,
    @Param('desafio') _id: string,
  ) {
    const desafio: iDesafio = await lastValueFrom(
      this.clientDesafios.send('consultar-desafios', {
        idJogador: '',
        _id: _id,
      }),
    );

    this.logger.log(`desafio: ${JSON.stringify(desafio)}`);

    if (!desafio) {
      throw new BadRequestException(`Desafio não cadastrado!`);
    }

    if (desafio.status == DesafioStatus.REALIZADO) {
      throw new BadRequestException(`Desafio já realizado!`);
    }

    if (desafio.status != DesafioStatus.ACEITO) {
      throw new BadRequestException(
        `Partidas somente podem ser lançadas em desafios aceitos pelos adversários!`,
      );
    }

    if (!desafio.jogadores.includes(atribuirDesafioPartidaDto.def)) {
      throw new BadRequestException(
        `O jogador vencedor da partida deve fazer parte do desafio!`,
      );
    }

    /*
        Criamos nosso objeto partida, que é formado pelas
        informações presentes no Dto que recebemos e por informações
        presentes no objeto desafio que recuperamos 
    */
    const partida: iPartida = {};
    partida.categoria = desafio.categoria;
    partida.def = atribuirDesafioPartidaDto.def;
    partida.desafio = _id;
    partida.jogadores = desafio.jogadores;
    partida.resultado = atribuirDesafioPartidaDto.resultado;

    /*
        Enviamos a partida para o tópico 'criar-partida'
        Este tópico é responsável por persitir a partida na 
        collection Partidas
    */

    this.clientDesafios.emit('criar-partida', partida);
  }

  @Delete('/:_id')
  async deletarDesafio(@Param('_id') _id: string) {
    const desafio: iDesafio = await lastValueFrom(
      this.clientDesafios.send('consultar-desafios', {
        idJogador: '',
        _id: _id,
      }),
    );

    this.logger.log(`desafio: ${JSON.stringify(desafio)}`);

    if (!desafio) {
      throw new BadRequestException(`Desafio não cadastrado!`);
    }

    this.clientDesafios.emit('deletar-desafio', desafio);
  }
}
