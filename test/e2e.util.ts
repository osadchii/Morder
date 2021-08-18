export class E2EUtil {
  static MockScheduleServices() {
    jest.mock('../src/marketplace/sbermegamarket/sbermegamarket.feed.service');
    jest.mock('../src/marketplace/yandexmarket/yandexmarket.feed.service');
    jest.mock('../src/marketplace/ozon/ozon.feed.service');
    jest.mock('../src/marketplace/meso/meso.integration.service');
  }
}
