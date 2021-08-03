import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export interface WildberriesModel extends Base {

}

export class WildberriesModel extends TimeStamps {
  @prop()
  name: string;
}
