import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { CompanyModel } from './company.model';

@Module({
  controllers: [CompanyController],
  imports: [
    TypegooseModule.forFeature([
      { typegooseClass: CompanyModel,
        schemaOptions: {
          collection: 'Company'
        }},
    ]),
  ],
  providers: [CompanyService]
})
export class CompanyModule {}
