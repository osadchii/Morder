import { Module } from '@nestjs/common';
import { OzonController } from './ozon.controller';
import { OzonService } from './ozon.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { OzonModel } from './ozon.model';

@Module({
  controllers: [OzonController],
  imports: [
    TypegooseModule.forFeature([
      {
        typegooseClass: OzonModel,
        schemaOptions: {
          collection: 'Ozon',
        },
      },
    ]),
  ],
  providers: [OzonService],
})
export class OzonModule {
}
