import { Module } from '@nestjs/common';
import { AliexpressService } from './aliexpress.service';
import { AliexpressController } from './aliexpress.controller';
import { TypegooseModule } from 'nestjs-typegoose';
import { AliexpressModel } from './aliexpress.model';

@Module({
  providers: [AliexpressService],
  imports: [
    TypegooseModule.forFeature([
      {
        typegooseClass: AliexpressModel,
        schemaOptions: {
          collection: 'Aliexpress',
        },
      },
    ]),
  ],
  controllers: [AliexpressController],
})
export class AliexpressModule {
}
