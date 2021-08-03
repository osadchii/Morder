import { Module } from '@nestjs/common';
import { MesoService } from './meso.service';
import { MesoController } from './meso.controller';
import { TypegooseModule } from 'nestjs-typegoose';
import { MesoModel } from './meso.model';

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
  ],
  controllers: [MesoController],
})
export class MesoModule {
}
