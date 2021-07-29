import { Module } from '@nestjs/common';
import { SberMegaMarketController } from './sbermegamarket.controller';
import { SberMegaMarketService } from './sbermegamarket.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { SberMegaMarketModel } from './sbermegamarket.model';

@Module({
  controllers: [SberMegaMarketController],
  imports: [
    TypegooseModule.forFeature([
      { typegooseClass: SberMegaMarketModel,
        schemaOptions: {
          collection: 'SberMegaMarket'
        }},
    ]),
  ],
  providers: [SberMegaMarketService],
})
export class SberMegaMarketModule {
}
