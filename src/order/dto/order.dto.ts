import { MarketplaceType } from '../../marketplace/marketplace.enum';
import { DeliveryType, OrderStatus } from '../order.model';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {

  @IsNumber()
  @Min(1)
  itemIndex: number;

  @IsString()
  productId: string;

  @IsNumber()
  count: number;

  @IsNumber()
  price: number;

  @IsBoolean()
  cancelled: boolean;

}

export class OrderDto {

  @IsDate()
  date: Date;

  @IsDate()
  shippingDate: Date;

  @IsEnum(MarketplaceType)
  marketplaceType: MarketplaceType;

  @IsString()
  marketplaceId: string;

  @IsString()
  marketplaceNumber: string;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @IsArray()
  @ValidateNested()
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
