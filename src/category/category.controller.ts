import { Body, Controller, Get, HttpCode, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { CategoryDto } from './dto/category.dto';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {

  constructor(private readonly categoryService: CategoryService) {
  }

  @UsePipes(new ValidationPipe())
  @Post('post')
  @HttpCode(200)
  async post(@Body() dto: CategoryDto) {
    return this.categoryService.createOrUpdate(dto);
  }

  @Get('/')
  async get() {
    return this.categoryService.getAll();
  }
}
