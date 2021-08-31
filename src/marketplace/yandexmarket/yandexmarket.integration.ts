import { HttpService } from '@nestjs/axios';
import { YandexMarketModel } from './yandexmarket.model';
import { Logger } from '@nestjs/common';

interface YandexMarketSkuPageModel {
  nextPageToken?: string;
  items: Map<string, number>;
}

interface YandexMarketSkuPageResponse {
  status: string;
  result?: {
    offerMappingEntries: {
      offer: {
        shopSku: string;
      };
      mapping?: {
        marketSku: number;
      };
    }[];
    paging?: {
      nextPageToken?: string;
    };
  };
  errors?: {
    code: string;
    message: string;
  }[];
}

export class YandexMarketIntegration {
  private readonly logger = new Logger(YandexMarketIntegration.name);
  private readonly baseUrl =
    'https://api.partner.market.yandex.ru/v2/campaigns';

  constructor(
    private readonly settings: YandexMarketModel,
    private readonly httpService: HttpService,
  ) {}

  async getYandexMarketSkus() {
    let pageToken: string = undefined;
    let stopped = false;
    const map = new Map<string, number>();

    while (!stopped) {
      const result = await this.getYandexMarketSkuPage(pageToken);
      result.items.forEach((value, key) => {
        map.set(key, value);
      });
      if (result.nextPageToken) {
        pageToken = result.nextPageToken;
      } else {
        stopped = true;
      }
    }

    this.logger.log(`Got ${map.size} yandex.market skus`);
    return map;
  }

  private async getYandexMarketSkuPage(
    nextPageToken?: string,
  ): Promise<YandexMarketSkuPageModel> {
    const { campaignId } = this.settings;

    const pageParameter = nextPageToken ? `?page_token=${nextPageToken}` : '';
    const url = `${this.baseUrl}/${campaignId}/offer-mapping-entries.json?status=READY${pageParameter}`;

    const result: YandexMarketSkuPageModel = {
      items: new Map<string, number>(),
    };

    await this.httpService
      .get(url, {
        headers: {
          ...this.authorizationHeader(),
        },
      })
      .toPromise()
      .then((response) => {
        const data = response.data as YandexMarketSkuPageResponse;
        if (!data.result) {
          return;
        }
        const { paging, offerMappingEntries } = data.result;
        if (paging.nextPageToken) {
          result.nextPageToken = paging.nextPageToken;
        }
        offerMappingEntries.forEach((item) => {
          if (!item.mapping) {
            return;
          }
          result.items.set(item.offer.shopSku, item.mapping.marketSku);
        });

        this.logger.log(`Got ${result.items.size} yandex.market skus`);
        this.logger.log(`Next page ${result.nextPageToken}`);
      })
      .catch((error) => {
        this.logger.error(`Can't get yandex.market skus.\nError ${error}`);
      });

    return result;
  }

  private authorizationHeader() {
    return {
      Authorization: `OAuth oauth_token="${this.settings.authToken}", oauth_client_id="${this.settings.clientId}"`,
    };
  }
}
