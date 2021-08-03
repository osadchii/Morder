import { IsString } from 'class-validator';

export class AliexpressDto {
  @IsString()
  name: string;
}
