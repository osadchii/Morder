import { IsNumber, Max, Min } from 'class-validator';

export class GetProductsDto{

  @Min(1)
  @Max(5000)
  @IsNumber()
  limit:number;

  @Min(0)
  @IsNumber()
  offset:number;
}