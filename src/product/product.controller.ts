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

  // PRODUCTS

  // Get product by id
  @Get('getById/:id')
  async getById(@Param('id', IdValidationPipe) id: string) {
    const product = await this.productService.getById(id);
    if (!product) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }
    return product;
  }

  // Get products page
  @UsePipes(new ValidationPipe())
  @Post('getPage')
  @HttpCode(200)
  async get(@Body() { offset, limit }: GetProductsDto) {
    return this.productService.getProductsWithOffsetLimit(offset, limit);
  }

  // Create or update product. Looking for erp code
  @UsePipes(new ValidationPipe())
  @Post('post')
  @HttpCode(200)
  async post(@Body() dto: ProductDto) {
    return this.productService.createOrUpdate(dto);
  }

  // Force delete product by id
  @Delete(':id')
  async delete(@Param('id', IdValidationPipe) id: string) {
    const deletedProduct = await this.productService.deleteById(id);
    if (!deletedProduct) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }
    return deletedProduct;
  }

  // STOCKS

  // Set stock by erp code
  @UsePipes(new ValidationPipe())
  @Post('setStock')
  async updateStock(@Body() { erpCode, stock }: SetStockDto) {
    const updatedProduct = await this.productService.updateStock(erpCode, stock);
    if (!updatedProduct) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }
    return updatedProduct;
  }

  // Get all stocks per articul
  @Get('stocks')
  async getStocks() {
    return this.productService.getStocks();
  }

  // Get stocks by articuls array
  @Post('stocksByArticuls')
  @HttpCode(200)
  async getStocksByArticuls(@Body() articuls: string[]) {
    return this.productService.getStocks(articuls);
  }

}
