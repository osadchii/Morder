import { IsString, IsUrl, MaxLength } from 'class-validator';

export class CompanyDto {

  @IsString()
  shopName: string;

  @IsString()
  companyName: string;

  @IsUrl()
  url: string;

  @IsString()
  @MaxLength(12)
  inn: string;

  @IsString()
  kpp: string;

}
