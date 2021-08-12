import { MesoModel } from './meso.model';
import { HttpService } from '@nestjs/axios';
import { MesoGetTokenApiModel } from './api-model/meso.get-token.api.model';
import { Logger } from '@nestjs/common';
import { MesoCatalogApiModel } from './api-model/meso.catalog.api.model';

export class MesoIntegration {

  private readonly baseUrl = 'https://api.meso.hqcode.ru';

  constructor(
    private readonly marketplaceSettings: MesoModel,
    private readonly httpService: HttpService) {
  }

  private readonly logger = new Logger(MesoIntegration.name);

  async sendCatalog(catalog: MesoCatalogApiModel): Promise<boolean> {

    const url = `${this.baseUrl}/api/store/integration/catalog/upload`;
    const token = await this.getToken();

    ///////// For testing
    if (token){
      return true;
    }
    return false;
    /////////

    let success = false;

    if (token === '')
      return;

    const { name } = this.marketplaceSettings;

    this.httpService.post(url, catalog)
      .toPromise()
      .then(() => {
        this.logger.log(`Successfully sent catalog to ${name} MESO.`);
        success = true;
      })
      .catch((error) => {
        const data = error.response.data;
        const { title, status } = data;
        this.logger.error(`Can't send catalog to ${name} MESO.\nResponse status code: ${status}. Error title ${title}`);
      });

    return success;

  }

  private async getToken(): Promise<string> {

    const url = `${this.baseUrl}/api/store/token/request`;
    const { login, password } = this.marketplaceSettings;

    let token = '';

    const body: MesoGetTokenApiModel = {
      UserName: login,
      Password: password,
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
