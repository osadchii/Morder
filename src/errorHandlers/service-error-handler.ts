import { HttpException } from '@nestjs/common';

export class ServiceErrorHandler {
  static catchNotUniqueValueError(error) {
    if (error.code != 11000)
      throw error;

    let messages: string[] = [];

    for (let key in error.keyValue) {
      if (error.keyValue.hasOwnProperty(key)) {
        messages.push(`Value \'${error.keyValue[key]}\' is not unique for \'${key}\' field`);
      }
    }
    throw new HttpException(messages.join('\n'), 422);
  }

}