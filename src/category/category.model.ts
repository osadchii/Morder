import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';

export interface CategoryModel extends Base {

}

export class CategoryModel extends TimeStamps {
  @prop()
  name: string;
  @prop()
  erpCode: string;
  @prop()
  isDeleted: boolean;
  @prop()
  parentId?: string;
}