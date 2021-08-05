import { Module } from '@nestjs/common';
import { MesoService } from './meso.service';
import { MesoController } from './meso.controller';
import { TypegooseModule } from 'nestjs-typegoose';
import { MesoModel } from './meso.model';
import { HttpModule } from '@nestjs/axios';
import { getHttpConfig } from '../configs/http.config';

@Module({
  providers: [MesoService],
  imports: [
    TypegooseModule.forFeature([
      {
        typegooseClass: MesoModel,
        schemaOptions: {
          collection: 'meso',
        },
      },
    ]),
    HttpModule.registerAsync({
      useFactory: getHttpConfig,
    }),
  ],
  controllers: [MesoController],
})
export class MesoModule {
}
