

class MesoError {
  propertyName: string;
  message: string;
}

export class MesoResponseApiModel<T> {
  data: T;
  errors: MesoError[];
  success: boolean;
}
