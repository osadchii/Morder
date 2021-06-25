
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

export const newProductName = 'New product name';