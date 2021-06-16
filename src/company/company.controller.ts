import { Body, Controller, Get, HttpCode, NotFoundException, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { CompanyDto } from './dto/company.dto';
import { CompanyService } from './company.service';
import { COMPANY_NOT_FOUND_ERROR } from './company.constants';

@Controller('company')
export class CompanyController {

  constructor(private readonly companyService: CompanyService) {
  }

  @Get()
  async get() {
    const company = await this.companyService.get();
    if (!company){
      throw new NotFoundException(COMPANY_NOT_FOUND_ERROR);
    }
    return company;
  }

  @UsePipes(new ValidationPipe())
  @Post()
  @HttpCode(200)
  async post(@Body() dto: CompanyDto) {
    return this.companyService.createOrUpdate(dto);
  }
}
