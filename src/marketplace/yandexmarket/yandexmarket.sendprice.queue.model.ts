import { prop } from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { Types } from 'mongoose';

export interface YandexMarketSendPriceQueueModel extends Base {}

export class YandexMarketSendPriceQueueModel extends TimeStamps {
  @prop()
  marketplaceId: Types.ObjectId;

  @prop()
  marketSku: number;

  @prop()
  price: number;
}
