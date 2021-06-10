import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export interface ProductModel extends Base {
}

export class ProductModel extends TimeStamps {

  @prop()
  name:string;



}