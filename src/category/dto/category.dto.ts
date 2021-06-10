import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CategoryDto {

  @IsString()
  name: string;

  @IsString()
  erpCode: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsBoolean()
  isDeleted: boolean;
}