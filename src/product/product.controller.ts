import {
  Body,
  Controller, Delete,
  Get,
  HttpCode, HttpException,
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
import { CATEGORY_NOT_FOUND_ERROR, PRODUCT_NOT_FOUND_ERROR } from './product.constants';
import { SetStockDto } from './dto/set-stock.dto';
import { CategoryService } from '../category/category.service';
import { SetPriceDto } from './dto/set-price.dto';
import { SetSpecialPriceDto } from './dto/set-special-price.dto';

@Controller('product')
export class ProductController {

  constructor(private readonly productService: ProductService,
              private readonly categoryService: CategoryService) {
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
  @Post('getPage')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  async get(@Body() { offset, limit }: GetProductsDto) {
    return this.productService.getProductsWithOffsetLimit(offset, limit);
  }

  // Create or update product. Looking for erp code
  @Post('post')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  async post(@Body() dto: ProductDto) {
    if (dto.categoryCode) {
      const category = await this.categoryService.getByErpCode(dto.categoryCode);
      if (!category) {
        throw new HttpException(CATEGORY_NOT_FOUND_ERROR, 422);
      }
    }
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
  @Post('setStock')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  async updateStock(@Body() dto: SetStockDto) {
    const updatedProduct = await this.productService.updateStock(dto);
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

  // PRICES

  @Post('setBasePrice')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  async updateBasePrice(@Body() dto: SetPriceDto) {
    const updatedProduct = await this.productService.updateBasePrice(dto);
    if (!updatedProduct) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }
    return updatedProduct;
  }

  @Post('setSpecialPrice')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  async updateSpecialPrice(@Body() dto: SetSpecialPriceDto){
    const updatedProduct = await this.productService.updateSpecialPrice(dto);
    if (!updatedProduct) {
      throw new NotFoundException(PRODUCT_NOT_FOUND_ERROR);
    }
    return updatedProduct;
  }

}
