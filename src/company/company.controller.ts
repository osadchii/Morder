import { Body, Controller, Get, HttpCode, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { CompanyDto } from './dto/company.dto';
import { CompanyService } from './company.service';
import { COMPANY_NOT_FOUND_ERROR } from './company.constants';
import { JwtAuthGuard } from '../guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('company')
export class CompanyController {

  constructor(private readonly companyService: CompanyService) {
  }

  @Get()
  async get() {
    const company = await this.companyService.get();
    if (!company) {
      throw new NotFoundException(COMPANY_NOT_FOUND_ERROR);
    }
    return company;
  }

  @Post()
  @HttpCode(200)
  async post(@Body() dto: CompanyDto) {
    return this.companyService.createOrUpdate(dto);
  }
}
