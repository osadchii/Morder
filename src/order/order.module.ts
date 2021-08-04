import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypegooseModule } from 'nestjs-typegoose';
import { OrderModel } from './order.model';

@Module({
  providers: [OrderService],
  imports:
    [
      TypegooseModule.forFeature([
        {
          typegooseClass: OrderModel,
          schemaOptions: {
            collection: 'Order',
          },
        },
      ]),
    ],
  controllers: [OrderController],
})

export class OrderModule {
}
