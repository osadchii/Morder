import { IsString, IsUrl, MaxLength } from 'class-validator';

export class CompanyDto {


  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsString()
  @MaxLength(12)
  inn: string;

  @IsString()
  kpp: string;
}