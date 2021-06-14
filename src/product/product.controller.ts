import {
  Body,
  Controller, Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductDto } from './dto/product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { ProductService } from './product.service';
import { IdValidationPipe } from '../pipes/id-validation-pipe';
import { PRODUCT_NOT_FOUND_ERROR } from './product.constants';
import { SetStockDto } from './dto/set-stock.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {
  }

  @Get('getById/:id')
  async getById(@Param('id', IdValidationPipe) id: string) {
    const product = await this.productService.getById(id);
    if (!product) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }
    return product;
  }

  @UsePipes(new ValidationPipe())
  @Post('getPage')
  @HttpCode(200)
  async get(@Body() { offset, limit }: GetProductsDto) {
    return this.productService.getProductsWithOffsetLimit(offset, limit);
  }

  @Get('stocks')
  async getStocks() {
    return this.productService.getStocks();
  }

  @Post('stocksByArticuls')
  async getStocksByArticuls(@Body() articuls: string[]) {
    return this.productService.getStocksByArticuls(articuls);
  }

  @UsePipes(new ValidationPipe())
  @Post('post')
  @HttpCode(200)
  async post(@Body() dto: ProductDto) {
    return this.productService.createOrUpdate(dto);
  }

  @Delete(':id')
  async delete(@Param('id', IdValidationPipe) id: string) {
    const deletedProduct = await this.productService.deleteById(id);
    if (!deletedProduct) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }
    return deletedProduct;
  }

  @UsePipes(new ValidationPipe())
  @Post('setStock')
  async updateStock(@Body() { erpCode, stock }: SetStockDto) {
    const updatedProduct = await this.productService.updateStock(erpCode, stock);
    if (!updatedProduct) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }
    return updatedProduct;
  }
}
