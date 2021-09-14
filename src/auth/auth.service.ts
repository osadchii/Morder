import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { UserModel } from './user.model';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { compare, genSalt, hash } from 'bcryptjs';
import { USER_NOT_FOUND_ERROR, WRONG_PASSWORD_ERROR } from './auth.constants';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(UserModel) private readonly userModel: ModelType<UserModel>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(dto: UserDto) {
    this.logger.log(`Creating user: ${dto.login}`);
    const salt = await genSalt(10);
    const newUser = new this.userModel({
      email: dto.login,
      passwordHash: await hash(dto.password, salt),
    });
    return newUser.save();
  }

  async findUser(email: string) {
    return this.userModel
      .findOne({
        email: email.toLocaleLowerCase(),
      })
      .exec();
  }

  async validateUser(email: string, password: string) {
    const user = await this.findUser(email);
    if (!user) {
      this.logger.warn(`Wrong email: ${email}`);
      throw new UnauthorizedException(USER_NOT_FOUND_ERROR);
    }
    const isCorrectPassword = await compare(password, user.passwordHash);
    if (!isCorrectPassword) {
      this.logger.warn(`Wrong password for user with email: ${email}`);
      throw new UnauthorizedException(WRONG_PASSWORD_ERROR);
    }
    return { email: user.email };
  }

  async login(email: string) {
    const payload = { email };
    this.logger.log(`Logged in user with email: ${email}`);

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
