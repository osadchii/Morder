import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import { IdValidationPipe } from '../pipes/id-validation-pipe';
import { YandexMarketService } from './yandexmarket.service';
import { YandexMarketDto } from './dto/yandexmarket.dto';
import { MARKETPLACE_NOT_FOUND } from '../marketplace/marketplace.constants';

@Controller('yandexmarket')
export class YandexMarketController {
  constructor(private readonly yandexMarketService: YandexMarketService) {
  }

  @Get('get')
  async getAll() {
    return this.yandexMarketService.get();
  }

  @Get('get/:id')
  async getById(@Param('id', IdValidationPipe) id: string) {
    const market = await this.yandexMarketService.getById(id);

    if (!market) {
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }

    return market;
  }

  @Post('create')
  async create(@Body() dto: YandexMarketDto) {
    return this.yandexMarketService.create(dto);
  }

  @Post('update/:id')
  @HttpCode(200)
  async update(@Param('id', IdValidationPipe) id: string,
               @Body() dto: YandexMarketDto) {
    const updatedMarket = await this.yandexMarketService.update(id, dto);

    if (!updatedMarket) {
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }

    return updatedMarket;
  }

  @Delete('delete/:id')
  async deleteById(@Param('id', IdValidationPipe) id: string) {
    const deletedMarket = await this.yandexMarketService.deleteById(id);

    if (!deletedMarket) {
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }

    return deletedMarket;
  }

}
