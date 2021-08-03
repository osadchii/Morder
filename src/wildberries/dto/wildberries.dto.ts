import { IsString } from 'class-validator';

export class WildberriesDto {
  @IsString()
  name: string;
}
