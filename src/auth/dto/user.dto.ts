import { IsEmail, IsString } from 'class-validator';

export class UserDto {

  @IsEmail()
  login: string;

  @IsString()
  password: string;
}
