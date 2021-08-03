import { IsString } from 'class-validator';

export class MesoDto {
  @IsString()
  name: string;
}
