import { path } from 'app-root-path';
import { ConfigService } from '@nestjs/config';
import { ensureDir, writeFile } from 'fs-extra';

export class ProductImageHelper {

  static IsImageMimeType(mimeType: string) {
    return (mimeType == 'image/jpg'
      || mimeType == 'image/jpeg'
      || mimeType == 'image/png');
  }

  static FullFileName(filePath: string, fileName: string) {
    const uploadFolder = `${path}/${filePath}`;
    return `${uploadFolder}/${fileName}`;
  }

  static ImagePath(configService: ConfigService) {
    return configService.get('IMAGE_PATH');
  }

  static async SaveFile(filePath: string, fileName: string, buffer: Buffer) {
    const fullFileName = ProductImageHelper.FullFileName(filePath, fileName);

    await ensureDir(filePath);
    return writeFile(fullFileName, buffer);
  }

  static ImageBaseUrl(configService: ConfigService) {
    const domain = configService.get('DOMAIN');
    const prefix = configService.get('URL_PREFIX');
    const imageUrl = configService.get('URL_IMAGE');
    return `${domain}/${prefix}/${imageUrl}/`;
  }

  static ImageUrl(configService: ConfigService, imageName: string){
    const baseUrl = this.ImageBaseUrl(configService);
    return `${baseUrl}${imageName}`;
  }

}
