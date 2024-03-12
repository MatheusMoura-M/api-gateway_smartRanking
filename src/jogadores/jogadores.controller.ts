import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Observable, lastValueFrom } from 'rxjs';
import { ValidacaoParametrosPipe } from 'src/common/pipes/validacao-parametros.pipe';
import { ClientProxySmartRanking } from 'src/proxyrmq/client-proxy';
import { AtualizarJogadorDto } from './dtos/atualizar-jogador.dto';
import { CriarJogadorDto } from './dtos/criar-jogador.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AwsService } from 'src/aws/aws.service';

@Controller('api/v1/jogadores')
export class JogadoresController {
  private logger = new Logger(JogadoresController.name);

  constructor(
    private clientProxySmartRanking: ClientProxySmartRanking,
    private awsService: AwsService,
  ) {}

  private clientAdminBackend =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  @Post()
  @UsePipes(ValidationPipe)
  async criarJogador(@Body() criarJogadorDto: CriarJogadorDto) {
    this.logger.log(`criarJogadorDto: ${JSON.stringify(criarJogadorDto)}`);

    try {
      const categoria = await lastValueFrom(
        this.clientAdminBackend.send(
          'consultar-categorias',
          criarJogadorDto.categoria,
        ),
      );

      if (categoria) {
        this.clientAdminBackend.emit('criar-jogador', criarJogadorDto);
      } else {
        throw new BadRequestException('Categoria não encontrada');
      }
    } catch (err) {
      if (err.message.startsWith('Cast to ObjectId failed for value')) {
        throw new BadRequestException('ID da categoria inválido');
      } else if (err instanceof BadRequestException) {
        throw err;
      } else {
        throw new BadRequestException(err);
      }
    }
  }

  @Post('/:_id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadArquivo(@UploadedFile() file: any, @Param('_id') _id: string) {
    const jogador = await lastValueFrom(
      this.clientAdminBackend.send('consultar-jogadores', _id),
    );

    if (!jogador) {
      throw new BadRequestException('Jogador não encontrado');
    }

    const fotoJogador = await this.awsService.uploadArquivo(file, _id);

    const atualizarJogadorDto: AtualizarJogadorDto = {};
    atualizarJogadorDto.urlFotoJogador = fotoJogador.url;

    this.clientAdminBackend.emit('atualizar-jogador', {
      id: _id,
      jogador: atualizarJogadorDto,
    });

    return this.clientAdminBackend.send('consultar-jogadores', _id);
  }

  @Get()
  consultarJogadores(@Query('idJogador') _id: string): Observable<any> {
    return this.clientAdminBackend.send('consultar-jogadores', _id ? _id : '');
  }

  @Put('/:_id')
  @UsePipes(ValidationPipe)
  async atualizarJogador(
    @Body() atualizarJogadorDto: AtualizarJogadorDto,
    @Param('_id', ValidacaoParametrosPipe) _id: string,
  ) {
    try {
      if (atualizarJogadorDto.categoria) {
        const categoria = await lastValueFrom(
          this.clientAdminBackend.send(
            'consultar-categorias',
            atualizarJogadorDto.categoria,
          ),
        );

        if (categoria) {
          this.clientAdminBackend.emit('atualizar-jogador', {
            id: _id,
            jogador: atualizarJogadorDto,
          });
        } else {
          throw new BadRequestException('Categoria não encontrada!');
        }
      } else {
        this.clientAdminBackend.emit('atualizar-jogador', {
          id: _id,
          jogador: atualizarJogadorDto,
        });
      }
    } catch (err) {
      if (err.message.startsWith('Cast to ObjectId failed for value')) {
        throw new BadRequestException('ID da categoria inválido');
      } else if (err instanceof BadRequestException) {
        throw err;
      } else {
        throw new BadRequestException(err);
      }
    }
  }

  @Delete('/:_id')
  deletarJogador(@Param('_id', ValidacaoParametrosPipe) _id: string) {
    return this.clientAdminBackend.emit('deletar-jogador', _id);
  }
}
