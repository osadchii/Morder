import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { SberMegaMarketService } from './sbermegamarket.service';
import { SberMegaMarketDto } from './dto/sbermegamarket.dto';
import { IdValidationPipe } from '../../infrastructure/pipes/id-validation-pipe';
import { MARKETPLACE_NOT_FOUND } from '../marketplace.constants';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
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
    const market = await this.sberMegaMarketService.getById(id);

    if (!market) {
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }

    return market;
  }

  @Post('create')
  async create(@Body() dto: SberMegaMarketDto) {
    return this.sberMegaMarketService.create(dto);
  }

  @Post('update/:id')
  @HttpCode(200)
  async update(@Param('id', IdValidationPipe) id: string,
               @Body() dto: SberMegaMarketDto) {
    const updatedMarket = await this.sberMegaMarketService.update(id, dto);

    if (!updatedMarket) {
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }

    return updatedMarket;
  }

  @Delete('delete/:id')
  async deleteById(@Param('id', IdValidationPipe) id: string) {
    const deletedMarket = await this.sberMegaMarketService.deleteById(id);

    if (!deletedMarket) {
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }

    return deletedMarket;
  }

}
