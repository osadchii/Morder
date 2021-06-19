import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';

class CategoryMarketplaceSettings {

  @prop()
  marketplaceId: Types.ObjectId;

  @prop()
  blocked: boolean;

}

export interface CategoryModel extends Base {

}

export class CategoryModel extends TimeStamps {

  @prop()
  name: string;

  @prop({ unique: true })
  erpCode: string;

  @prop()
  isDeleted: boolean;

  @prop()
  parentCode?: string;

  @prop({ type: () => [CategoryMarketplaceSettings], _id: false })
  marketplaceSettings?: CategoryMarketplaceSettings[];

}