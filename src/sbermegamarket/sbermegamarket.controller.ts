import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import { SberMegaMarketService } from './sbermegamarket.service';
import { SberMegaMarketDto } from './dto/sbermegamarket.dto';
import { IdValidationPipe } from '../pipes/id-validation-pipe';
import { SBERMEGAMARKET_NOT_FOUND } from './sbermegamarket.constants';

@Controller('sbermegamarket')
export class SberMegaMarketController {
  constructor(private readonly sberMegaMarketService: SberMegaMarketService) {
  }

  @Get('get')
  async getAll() {
    return this.sberMegaMarketService.get();
  }

  @Get('get/:id')
  async getById(@Param('id', IdValidationPipe) id: string) {
    const sberMegaMarget = await this.sberMegaMarketService.getById(id);

    if (!sberMegaMarget) {
      throw new NotFoundException(SBERMEGAMARKET_NOT_FOUND);
    }

    return sberMegaMarget;
  }

  @Post('create')
  async create(@Body() dto: SberMegaMarketDto) {
    return this.sberMegaMarketService.create(dto);
  }

  @Post('update/:id')
  @HttpCode(200)
  async update(@Param('id', IdValidationPipe) id: string,
               @Body() dto: SberMegaMarketDto) {
    const updatedSberMegaMarket = await this.sberMegaMarketService.update(id, dto);

    if (!updatedSberMegaMarket) {
      throw new NotFoundException(SBERMEGAMARKET_NOT_FOUND);
    }

    return updatedSberMegaMarket;
  }

  @Delete('delete/:id')
  async deleteById(@Param('id', IdValidationPipe) id: string) {
    const deletedSberMegaMarket = await this.sberMegaMarketService.deleteById(id);

    if (!deletedSberMegaMarket) {
      throw new NotFoundException(SBERMEGAMARKET_NOT_FOUND);
    }

    return deletedSberMegaMarket;
  }

}
