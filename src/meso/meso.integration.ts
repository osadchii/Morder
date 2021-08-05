import { MesoModel } from './meso.model';
import { HttpService } from '@nestjs/axios';
import { GetTokenApiModel } from './api-model/get-token.api.model';
import { Logger } from '@nestjs/common';
import { MesoProducts } from './api-model/catalog.api.model';

export class MesoIntegration {

  private readonly baseUrl = 'https://api.meso.hqcode.ru';

  constructor(
    private readonly marketplaceSettings: MesoModel,
    private readonly httpService: HttpService) {
  }

  private readonly logger = new Logger(MesoIntegration.name);

  async sendCatalog(catalog: MesoProducts) {

    const url = `${this.baseUrl}/api/store/integration/catalog/upload`;
    const token = await this.getToken();

    if (token === '')
      return;

    const { name } = this.marketplaceSettings;

    return this.httpService.post(url, catalog)
      .toPromise()
      .then(() => {
        this.logger.log(`Successfully sent catalog to ${name} MESO.`);
      })
      .catch((error) => {
        const data = error.response.data;
        const { title, status } = data;
        this.logger.error(`Can't send catalog to ${name} MESO.\nResponse status code: ${status}. Error title ${title}`);
      });
  }

  private async getToken() {

    const url = `${this.baseUrl}/api/store/token/request`;
    let token = '';

    const body: GetTokenApiModel = {
      UserName: this.marketplaceSettings.login,
      Password: this.marketplaceSettings.password,
    };

    await this.httpService.post(url, body)
      .toPromise()
      .then((response) => token = response.data.token)
      .catch((error) => {
        const data = error.response.data;
        const { title, status } = data;
        this.logger.error(`Can't get MESO auth token for ${this.marketplaceSettings.name}.\nResponse status code: ${status}. Error title: ${title}`);
      });

    return token;

  }
}
