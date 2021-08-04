import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { MarketplaceType } from '../marketplace/marketplace.enum';

export enum OrderStatus {
  CREATED = 'CREATED',
  RESERVED = 'RESERVED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED'
}

export enum DeliveryType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  EXPRESS = 'EXPRESS'
}

class OrderItemModel {

  @prop()
  itemIndex: number;

  @prop()
  productId: Types.ObjectId;

  @prop()
  count: number;

  @prop()
  price: number;

  @prop()
  sum: number;

  @prop()
  cancelled: boolean;

}

export interface OrderModel extends Base {

}

export class OrderModel extends TimeStamps {

  @prop()
  date: Date;

  @prop()
  shippingDate: Date;

  @prop({ enum: MarketplaceType })
  marketplaceType: MarketplaceType;

  @prop()
  marketplaceId: Types.ObjectId;

  @prop({ unique: true })
  marketplaceNumber: string;

  @prop()
  sum: number;

  @prop({ enum: OrderStatus })
  status: OrderStatus;

  @prop({ enum: DeliveryType })
  deliveryType: DeliveryType;

  @prop({ type: () => [OrderItemModel], _id: false })
  items: OrderItemModel[];
}
