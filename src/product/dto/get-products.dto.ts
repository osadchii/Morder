import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetProductsDto {
  @Min(1)
  @Max(5000)
  @IsNumber()
  limit: number;

  @Min(0)
  @IsNumber()
  offset: number;

  @IsString()
  @IsOptional()
  categoryCode?: string;

  @IsString()
  @IsOptional()
  text?: string;
}
