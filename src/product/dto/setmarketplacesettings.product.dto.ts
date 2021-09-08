import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SetMarketplaceSettingsProductDto {
  @IsString()
  @IsNotEmpty()
  erpCode: string;

  @IsString()
  @IsNotEmpty()
  marketplaceId: string;

  @IsOptional()
  @IsBoolean()
  nullifyStock?: boolean;

  @IsOptional()
  @IsBoolean()
  ignoreRestrictions?: boolean;
}
