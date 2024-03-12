import { Module } from '@nestjs/common';
import { AwsModule } from 'src/aws/aws.module';
import { ProxyRMQModule } from '../proxyrmq/proxyrmq.module';
import { JogadoresController } from './jogadores.controller';

@Module({
  imports: [ProxyRMQModule, AwsModule],
  controllers: [JogadoresController],
})
export class JogadoresModule {}
