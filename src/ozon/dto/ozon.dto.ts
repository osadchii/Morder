import { IsString } from 'class-validator';

export class OzonDto {
  @IsString()
  name: string;
}
