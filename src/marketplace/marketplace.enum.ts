import { AliexpressModel } from '../aliexpress/aliexpress.model';
import { MesoModel } from '../meso/meso.model';
import { OzonModel } from '../ozon/ozon.model';
import { SberMegaMarketModel } from '../sbermegamarket/sbermegamarket.model';
import { WildberriesModel } from '../wildberries/wildberries.model';
import { YandexMarketModel } from '../yandexmarket/yandexmarket.model';

export enum MarketplaceType {
  ALIEXPRESS = 'ALIEXPRESS',
  MESO = 'MESO',
  OZON = 'OZON',
  SBERMEGAMARKET = 'SBERMEGAMARKET',
  WILDBERRIES = 'WILDBERRIES',
  YANDEXMARKET = 'YANDEXMARKET'
}

export type MarketplaceModelType =
  AliexpressModel |
  MesoModel |
  OzonModel |
  SberMegaMarketModel |
  WildberriesModel |
  YandexMarketModel;

