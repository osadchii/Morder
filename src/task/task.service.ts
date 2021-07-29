import { Injectable, Logger } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { CompanyService } from '../company/company.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskService {

  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly companyService: CompanyService,
              private readonly productService: ProductService,
              private readonly categoryService: CategoryService,
              private readonly configService: ConfigService) {
  }

}
