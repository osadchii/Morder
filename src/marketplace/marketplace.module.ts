import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { MarketplaceModel } from './marketplace.model';

@Module({
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
  imports: [
    TypegooseModule.forFeature([
      { typegooseClass: MarketplaceModel,
        schemaOptions: {
          collection: 'Marketplace'
        }},
    ]),
  ]
})
export class MarketplaceModule {}
