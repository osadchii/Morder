import { ProductModel } from './product.model';
import { ProductDto } from './dto/product.dto';

export class ProductHelper {
  static toString(model: ProductDto | ProductModel): string {
    return `(${model.articul}) ${model.name}`;
  }

  static postProductMessage(model: ProductDto | ProductModel): string{
    return `Post ${this.toString(model)}`;
  }

  static deleteProductMessage(id: string): string{
    return `Delete product with id ${id}`;
  }
}