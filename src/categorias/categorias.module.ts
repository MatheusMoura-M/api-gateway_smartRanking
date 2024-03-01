import { Module } from '@nestjs/common';
import { CategoriasController } from './categorias.controller';
import { ProxyRMQModule } from 'src/proxyrmq/proxyrmq.module';

@Module({
  imports: [ProxyRMQModule],
  controllers: [CategoriasController],
})
export class CategoriasModule {}
