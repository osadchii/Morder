import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { IdValidationPipe } from '../pipes/id-validation-pipe';
import { MARKETPLACE_NOT_FOUND } from './marketplace.constants';
import { MarketplaceDto } from './dto/marketplace.dto';

@Controller('marketplace')
export class MarketplaceController {

  constructor(private readonly marketplaceService: MarketplaceService) {
  }

  @Get('/')
  async get() {
    return this.marketplaceService.getAll();
  }

  @Get('get/:id')
  async getById(@Param('id', IdValidationPipe) id: string) {
    const marketplace = await this.marketplaceService.getById(id);
    if (!marketplace) {
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }
    return marketplace;
  }

  @Post('create')
  async create(@Body() dto: MarketplaceDto) {
    console.log(JSON.stringify(dto));
    return this.marketplaceService.create(dto);
  }

  @Patch('update/:id')
  async update(@Param('id', IdValidationPipe) id: string, @Body() dto: MarketplaceDto) {
    const marketplace = await this.marketplaceService.update(id, dto);
    if (!marketplace) {
      return new NotFoundException(MARKETPLACE_NOT_FOUND);
    }
    return marketplace;
  }

  @Delete(':id')
  async delete(@Param('id', IdValidationPipe) id: string) {
    const deletedMarketplace = await this.marketplaceService.delete(id);
    if (!deletedMarketplace){
      throw new NotFoundException(MARKETPLACE_NOT_FOUND);
    }
    return deletedMarketplace;
  }

}
