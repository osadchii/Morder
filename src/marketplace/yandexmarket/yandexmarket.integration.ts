import { HttpService } from '@nestjs/axios';
import { YandexMarketModel } from './yandexmarket.model';
import { YandexMarketSkuPageModel } from './integration-model/yandexmarket-sku-page.model';
import { YandexMarketSendPriceQueueModel } from './yandexmarket.sendprice.queue.model';
import { YandexMarketSkuPageResponse } from './integration-model/yandexmarket-sku-page-response.model';
import { YandexMarketHiddenOffersPageModel } from './integration-model/yandexmarket-hidden-offers-page.model';
import { YandexMarketHiddenOffersPageResponse } from './integration-model/yandexmarket-hidden-offers-response.model';

export class YandexMarketIntegration {
  private readonly baseUrl =
    'https://api.partner.market.yandex.ru/v2/campaigns';

  constructor(
    private readonly settings: YandexMarketModel,
    private readonly httpService: HttpService,
  ) {}

  async getYandexMarketSkus(): Promise<Map<string, number>> {
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

    return map;
  }

  async getYandexMarketHiddenProducts(): Promise<string[]> {
    let pageToken: string = undefined;
    let stopped = false;
    const hiddenOffers: string[] = [];

    while (!stopped) {
      const result = await this.getYandexMarketHiddenProductsPage(pageToken);
      result.items.forEach((item) => {
        hiddenOffers.push(item);
      });
      if (result.nextPageToken) {
        pageToken = result.nextPageToken;
      } else {
        stopped = true;
      }
    }

    return hiddenOffers;
  }

  async hideProducts(skus: number[]) {
    const { campaignId } = this.settings;

    const url = `${this.baseUrl}/${campaignId}/hidden-offers.json`;
    const body = {
      hiddenOffers: skus.map((sku) => {
        return {
          marketSku: sku,
          comment: '???????????????????????? ?? ?????????????? ??-??????????',
          ttlInHours: 720,
        };
      }),
    };

    return this.httpService
      .post(url, body, {
        headers: {
          ...this.authorizationHeader(),
        },
      })
      .toPromise();
  }

  async showProducts(skus: number[]) {
    const { campaignId } = this.settings;

    const url = `${this.baseUrl}/${campaignId}/hidden-offers.json`;
    const body = {
      hiddenOffers: skus.map((sku) => {
        return {
          marketSku: sku,
        };
      }),
    };

    await this.httpService
      .delete(url, {
        headers: {
          ...this.authorizationHeader(),
        },
        data: body,
      })
      .toPromise();
  }

  async updatePrices(prices: YandexMarketSendPriceQueueModel[]) {
    const { campaignId } = this.settings;

    const url = `${this.baseUrl}/${campaignId}/offer-prices/updates.json`;
    const body = {
      offers: prices.map((item) => {
        return {
          marketSku: item.marketSku,
          price: {
            currencyId: 'RUR',
            value: item.price,
          },
        };
      }),
    };

    return this.httpService
      .post(url, body, {
        headers: {
          ...this.authorizationHeader(),
        },
      })
      .toPromise();
  }

  private async getYandexMarketHiddenProductsPage(nextPageToken?: string) {
    const { campaignId } = this.settings;

    const pageParameter = nextPageToken ? `?page_token=${nextPageToken}` : '';
    const url = `${this.baseUrl}/${campaignId}/hidden-offers.json${pageParameter}`;

    const result: YandexMarketHiddenOffersPageModel = {
      items: [],
    };

    await this.httpService
      .get(url, {
        headers: {
          ...this.authorizationHeader(),
        },
      })
      .toPromise()
      .then((response) => {
        const data = response.data as YandexMarketHiddenOffersPageResponse;
        if (!data.result) {
          return;
        }
        const { paging, hiddenOffers } = data.result;
        if (paging.nextPageToken) {
          result.nextPageToken = paging.nextPageToken;
        }
        hiddenOffers.forEach((item) => {
          result.items.push(item.offerId);
        });
      });

    return result;
  }

  private async getYandexMarketSkuPage(
    nextPageToken?: string,
  ): Promise<YandexMarketSkuPageModel> {
    const { campaignId } = this.settings;

    const pageParameter = nextPageToken ? `&page_token=${nextPageToken}` : '';
    const url = `${this.baseUrl}/${campaignId}/offer-mapping-entries.json?limit=200${pageParameter}`;

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
          if (item.mapping && item.mapping.marketSku) {
            result.items.set(item.offer.shopSku, item.mapping.marketSku);
          }
        });
      });

    return result;
  }

  private authorizationHeader() {
    return {
      Authorization: `OAuth oauth_token="${this.settings.authToken}", oauth_client_id="${this.settings.clientId}"`,
    };
  }
}
