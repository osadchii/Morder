import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SetMarketplaceBlockingCategoryDto {
  @IsString()
  @IsNotEmpty()
  erpCode: string;

  @IsBoolean()
  nested: boolean;

  @IsString()
  @IsNotEmpty()
  marketplaceId: string;

  @IsBoolean()
  blocked: boolean;
}
