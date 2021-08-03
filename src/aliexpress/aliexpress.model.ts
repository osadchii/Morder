import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export interface AliexpressModel extends Base {

}

export class AliexpressModel extends TimeStamps {
  @prop()
  name: string;
}
