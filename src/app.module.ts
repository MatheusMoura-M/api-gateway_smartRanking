import { Module } from '@nestjs/common';
import { CategoriasModule } from './categorias/categorias.module';
import { JogadoresModule } from './jogadores/jogadores.module';

@Module({
  imports: [CategoriasModule, JogadoresModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
