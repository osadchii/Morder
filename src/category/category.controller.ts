import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post, UseGuards,
} from '@nestjs/common';
import { CategoryDto } from './dto/category.dto';
import { CategoryService } from './category.service';
import { IdValidationPipe } from '../infrastructure/pipes/id-validation-pipe';
import { CATEGORY_NOT_FOUND_ERROR } from './category.constants';
import { JwtAuthGuard } from '../infrastructure/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('category')
export class CategoryController {

  constructor(private readonly categoryService: CategoryService) {
  }

  @Post('post')
  @HttpCode(200)
  async post(@Body() dto: CategoryDto) {
    return this.categoryService.createOrUpdate(dto);
  }

  @Get('/')
  async getAll() {
    return this.categoryService.getAll();
  }

  @Get('getById/:id')
  async getById(@Param('id', IdValidationPipe) id: string) {
    const category = await this.categoryService.getById(id);
    if (!category) {
      throw new NotFoundException(CATEGORY_NOT_FOUND_ERROR);
    }
    return category;
  }

  @Get('getByErpCode/:erpCode')
  async getByErpCode(@Param('erpCode') erpCode: string) {
    const category = await this.categoryService.getByErpCode(erpCode);
    if (!category){
      throw new NotFoundException(CATEGORY_NOT_FOUND_ERROR);
    }
    return category;
  }

  @Delete(':id')
  async delete(@Param('id', IdValidationPipe) id: string) {
    const deletedCategory = await this.categoryService.deleteById(id);
    if (!deletedCategory) {
      throw new NotFoundException(CATEGORY_NOT_FOUND_ERROR);
    }
  }
}
