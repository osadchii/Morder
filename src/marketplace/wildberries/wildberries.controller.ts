import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { IdValidationPipe } from '../../infrastructure/pipes/id-validation-pipe';
import { MARKETPLACE_NOT_FOUND } from '../marketplace.constants';
import { WildberriesService } from './wildberries.service';
import { WildberriesDto } from './dto/wildberries.dto';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('wildberries')
export class WildberriesController {
  constructor(private readonly marketplaceService: WildberriesService) {
  }

  @Get('get')
  async getAll() {
    return this.marketplaceService.get();
  }

  @Get('get/:id')
  async getById(@Param('id', IdValidationPipe) id: string) {
    const market = await this.marketplaceService.getById(id);

    if (!market) {
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }

    return market;
  }

  @Post('create')
  async create(@Body() dto: WildberriesDto) {
    return this.marketplaceService.create(dto);
  }

  @Post('update/:id')
  @HttpCode(200)
  async update(@Param('id', IdValidationPipe) id: string,
               @Body() dto: WildberriesDto) {
    const updatedMarket = await this.marketplaceService.update(id, dto);

    if (!updatedMarket) {
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }

    return updatedMarket;
  }

  @Delete('delete/:id')
  async deleteById(@Param('id', IdValidationPipe) id: string) {
    const deletedMarket = await this.marketplaceService.deleteById(id);

    if (!deletedMarket) {
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }

    return deletedMarket;
  }

}
