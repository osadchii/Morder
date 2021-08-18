import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CompanyDto {

  @IsNotEmpty()
  @IsString()
  shopName: string;

  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsUrl()
  url: string;

}
