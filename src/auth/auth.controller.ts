import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { AuthService } from './auth.service';
import { ALREADY_REGISTERED_ERROR } from './auth.constants';

@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) {
  }

  @Post('register')
  async register(@Body() dto: UserDto) {
    const oldUser = await this.authService.findUser(dto.login);

    if (oldUser) {
      throw new BadRequestException(ALREADY_REGISTERED_ERROR);
    }

    return this.authService.createUser(dto);
  }

  @HttpCode(200)
  @Post('login')
  async login(@Body() { login, password }: UserDto) {
    const user = await this.authService.validateUser(login, password);
    return this.authService.login(user.email);
  }

}
