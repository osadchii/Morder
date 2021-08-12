import { Module } from '@nestjs/common';
import { WildberriesService } from './wildberries.service';
import { WildberriesController } from './wildberries.controller';
import { TypegooseModule } from 'nestjs-typegoose';
import { WildberriesModel } from './wildberries.model';

@Module({
  providers: [WildberriesService],
  imports: [
    TypegooseModule.forFeature([
      {
        typegooseClass: WildberriesModel,
        schemaOptions: {
          collection: 'Wildberries',
        },
      },
    ]),
  ],
  controllers: [WildberriesController],
})
export class WildberriesModule {
}
