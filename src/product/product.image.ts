import { path } from 'app-root-path';
import { ConfigService } from '@nestjs/config';
import { ensureDir, writeFile } from 'fs-extra';

export class ProductImageHelper {

  static isImageMimeType(mimeType: string) {
    return (mimeType == 'image/jpg'
      || mimeType == 'image/jpeg'
      || mimeType == 'image/png');
  }

  static fullFileName(filePath: string, fileName: string) {
    const uploadFolder = `${path}/${filePath}`;
    return `${uploadFolder}/${fileName}`;
  }

  static imagePath(configService: ConfigService) {
    return configService.get('IMAGE_PATH');
  }

  static async saveFile(filePath: string, fileName: string, buffer: Buffer) {
    const fullFileName = ProductImageHelper.fullFileName(filePath, fileName);

    await ensureDir(filePath);
    await writeFile(fullFileName, buffer);
  }

  static imageBaseUrl(configService: ConfigService) {
    const domain = configService.get('DOMAIN');
    const prefix = configService.get('URL_PREFIX');
    const imageUrl = configService.get('URL_IMAGE');
    return `${domain}/${prefix}/${imageUrl}/`;
  }

  static imageUrlImageName(configService: ConfigService, imageName: string){
    const baseUrl = this.imageBaseUrl(configService);
    return `${baseUrl}${imageName}`;
  }

}
