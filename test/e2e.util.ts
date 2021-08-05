export class E2EUtil {
  static MockScheduleServices() {
    jest.mock('../src/sbermegamarket/sbermegamarket.feed.service');
    jest.mock('../src/yandexmarket/yandexmarket.feed.service');
    jest.mock('../src/ozon/ozon.feed.service');
  }
}
