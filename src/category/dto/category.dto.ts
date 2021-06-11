import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CategoryDto {

  @IsString()
  name: string;

  @IsString()
  erpCode: string;

  @IsOptional()
  @IsString()
  parentCode?: string;

  @IsBoolean()
  isDeleted: boolean;
}