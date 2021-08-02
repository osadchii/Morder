import { Types } from 'mongoose';

export const parentCategoryDto = {
  name: 'Test category',
  erpCode: 'TestCategoryErpCode',
  isDeleted: false,
};

export const childCategoryDto = {
  name: 'Child test category',
  erpCode: 'ChildTestCategoryErpCode',
  isDeleted: false,
  parentCode: parentCategoryDto.erpCode,
};

export const productDto = {
  name: 'Test product',
  erpCode: 'testProductErpCode1',
  barcode: 'barcode',
  isDeleted: false,
  articul: new Types.ObjectId().toHexString(),
  categoryCode: childCategoryDto.erpCode,
};

export const updateStockDto = {
  erpCode: productDto.erpCode,
  stock: 10000,
};

export const checkStocksArticuls = [
  productDto.articul,
];

export const updateBasePriceDto = {
  erpCode: productDto.erpCode,
  price: 10000,
};

export const updateSpecialPriceDto = {
  erpCode: productDto.erpCode,
  price: 10000,
  priceName: 'TEST SPECIAL PRICE NAME  ',
};

export const randomId = new Types.ObjectId().toHexString();
export const negativePriceMessage = 'price must not be less than 0.01';
export const negativeStockMessage = 'stock must not be less than 0';

export const newProductName = 'New product name';
