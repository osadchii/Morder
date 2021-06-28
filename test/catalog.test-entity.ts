
export const parentCategoryDto = {
  name: 'Test category',
  erpCode: 'TestCategoryErpCode',
  isDeleted: false,
};

export const childCategoryDto = {
  name: 'Child test category',
  erpCode: 'ChildTestCategoryErpCode',
  isDeleted: false,
  parentCode: parentCategoryDto.erpCode
}

export const productDto = {
  name: 'Test product',
  erpCode: 'testProductErpCode',
  barcode: 'barcode',
  isDeleted: false,
  articul: 'test articul',
  categoryCode: childCategoryDto.erpCode,
};

export const updateStockDto = {
  erpCode: productDto.erpCode,
  stock: 10000
}

export const checkStocksArticuls = [
  productDto.articul
]

export const updateBasePriceDto = {
  erpCode: productDto.erpCode,
  price: 10000
}

export const updateSpecialPriceDto = {
  erpCode: productDto.erpCode,
  price: 10000,
  priceName: "TEST SPECIAL PRICE NAME  "
}

export const newProductName = 'New product name';