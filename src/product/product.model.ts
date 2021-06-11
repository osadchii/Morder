import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

class ProductCharacteristic {
  @prop()
  name: string;
  @prop()
  value: string;
}

export interface ProductModel extends Base {
}

export class ProductModel extends TimeStamps {

  @prop()
  name: string;

  @prop({ unique: true })
  articul: string;

  @prop({ unique: true })
  erpCode: string;

  @prop()
  brand?: string;

  @prop()
  categoryCode?: string;

  @prop()
  isDeleted: boolean;

  @prop()
  stock?: number;

  @prop()
  weight?: number;

  @prop()
  height?: number;

  @prop()
  length?: number;

  @prop()
  width?: number;

  @prop()
  image?: string;

  @prop()
  description?: string;

  @prop({ type: () => [ProductCharacteristic], _id: false })
  characteristics?: ProductCharacteristic[];
}