import { Module } from '@nestjs/common';
import { DesafiosController } from './desafios.controller';
import { ProxyRMQModule } from 'src/proxyrmq/proxyrmq.module';

@Module({
  imports: [ProxyRMQModule],
  controllers: [DesafiosController],
})
export class DesafiosModule {}
