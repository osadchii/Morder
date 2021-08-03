import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export interface MesoModel extends Base {

}

export class MesoModel extends TimeStamps {
  @prop()
  name: string;
}
