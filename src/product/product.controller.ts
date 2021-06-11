import { Body, Controller, Get, HttpCode, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductDto } from './dto/product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { ProductService } from './product.service';
import { IdValidationPipe } from '../pipes/id-validation-pipe';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {
  }

  @Get(':id')
  async getById(@Param('id', IdValidationPipe) id: string){
    return this.productService.getById(id);
  }

  @UsePipes(new ValidationPipe())
  @Post('get')
  @HttpCode(200)
  async get(@Body() { offset, limit }: GetProductsDto) {
    return this.productService.getProductsWithOffsetLimit(offset, limit);
  }

  @UsePipes(new ValidationPipe())
  @Post('post')
  @HttpCode(200)
  async post(@Body() dto: ProductDto) {
    return this.productService.createOrUpdate(dto);
  }

}
