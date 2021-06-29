import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import {
  checkStocksArticuls,
  childCategoryDto, negativePriceMessage, negativeStockMessage,
  newProductName,
  parentCategoryDto,
  productDto, randomId,
  updateBasePriceDto, updateSpecialPriceDto,
  updateStockDto,
} from './catalog.test-entity';

// Mocking a service using schedule
jest.mock('../src/task/task.service');

describe('Product catalog (e2e)', () => {
  let app: INestApplication;

  let parentCategoryId: string;
  let childCategoryId: string;
  let productId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  // CREATE CATEGORIES

  it('/category/post Create parent category - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/category/post')
      .send(parentCategoryDto)
      .expect(200)
      .then(({ body }) => {
        parentCategoryId = body._id;
        expect(parentCategoryId).toBeDefined();
        done();
      });
  });

  it('/category/post Create child category - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/category/post')
      .send(childCategoryDto)
      .expect(200)
      .then(({ body }) => {
        childCategoryId = body._id;
        expect(childCategoryId).toBeDefined();
        done();
      });
  });

  // GET CATEGORIES

  it('/category/ Get all categories - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/category/')
      .expect(200)
      .then(({ body }) => {
        expect(body.length > 1);
        done();
      });
  });

  it('/category/getById/:id Get child category - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/category/getById/' + childCategoryId)
      .expect(200)
      .then(({ body }) => {
        expect(body.parentCode).toBeDefined();
        done();
      });
  });

  it('/category/getById/:id Get child category - Fail',() => {
    return request(app.getHttpServer())
      .get('/category/getById/' + randomId)
      .expect(404);
  });

  // CREATE PRODUCTS

  it('/product/post Create product with wrong category - Fail', () => {
    return request(app.getHttpServer())
      .post('/product/post')
      .send({ ...productDto, categoryCode: 'wrongCategoryCode' })
      .expect(422);
  });

  it('/product/post Create product - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/product/post')
      .send(productDto)
      .expect(200)
      .then(({ body }) => {
        productId = body._id;
        expect(productId).toBeDefined();
        done();
      });
  });

  it('/product/post Create product with not unique articul - Fail', () => {
    return request(app.getHttpServer())
      .post('/product/post')
      .send({ ...productDto, erpCode: 'New test erp code' })
      .expect(422);
  });

  // GET PRODUCTS

  it('/product/getPage Get product page - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/product/getPage')
      .send({
        offset: 0,
        limit: 5,
      })
      .expect(200)
      .then(({ body }) => {
        expect(body.length > 0);
        done();
      });
  });

  it('/product/getById/:id Get product by id - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/product/getById/' + productId)
      .expect(200)
      .then(({ body }) => {
        expect(body.articul).toBeDefined();
        done();
      });
  });

  it('/product/getById/:id Get product by id - Fail', () => {
    return request(app.getHttpServer())
      .get('/product/getById/' + randomId)
      .expect(404);
  });

  it('/product/getByErpCode/:erpCode Get product by erpCode - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/product/getByErpCode/' + productDto.erpCode)
      .expect(200)
      .then(({ body }) => {
        expect(body.articul).toBeDefined();
        done();
      });
  });

  // UPDATE PRODUCTS

  it('/product/post Update product - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/product/post')
      .send({ ...productDto, name: newProductName })
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(newProductName);
        done();
      });
  });

  // UPDATE STOCKS

  it('/product/setStock Update stock - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/product/setStock')
      .send(updateStockDto)
      .expect(200)
      .then(({ body }) => {
        expect(body.stock).toEqual(updateStockDto.stock);
        expect(body.erpCode).toEqual(updateStockDto.erpCode);
        done();
      });
  });

  it('/product/setStock Update negative stock - Fail', async (done) => {
    return request(app.getHttpServer())
      .post('/product/setStock')
      .send({ ...updateStockDto, stock: -1 })
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toContain(negativeStockMessage);
        done();
      });
  });

  // GET STOCKS

  it('/product/stocks Get stocks - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/product/stocks')
      .expect(200)
      .then(({ body }) => checkStocks(body, done));
  });

  it('/product/stocksByArticuls Get stocks by articuls - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/product/stocksByArticuls')
      .send(checkStocksArticuls)
      .expect(200)
      .then(({ body }) => checkStocks(body, done));
  });

  // UPDATE PRICES

  it('/product/setBasePrice Update base price - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/product/setBasePrice')
      .send(updateBasePriceDto)
      .expect(200)
      .then(({ body }) => {
        expect(body.price).toEqual(updateBasePriceDto.price);
        expect(body.erpCode).toEqual(updateBasePriceDto.erpCode);
        done();
      });
  });

  it('/product/setBasePrice Update negative base price - Fail', async (done) => {
    return request(app.getHttpServer())
      .post('/product/setBasePrice')
      .send({ ...updateBasePriceDto, price: -1 })
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toContain(negativePriceMessage)
        done();
      });
  });

  it('/product/setSpecialPrice Update special price - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/product/setSpecialPrice')
      .send(updateSpecialPriceDto)
      .expect(200)
      .then(({ body }) => {
        expect(body.erpCode).toEqual(updateBasePriceDto.erpCode);
        expect(body.specialPrices).toBeDefined();
        expect(body.specialPrices[0].priceName)
          .toEqual(updateSpecialPriceDto.priceName.trim().toLowerCase());
        expect(body.specialPrices[0].price)
          .toEqual(updateSpecialPriceDto.price);
        done();
      });
  });

  it('/product/setSpecialPrice Update negative special price - Fail', async (done) => {
    return request(app.getHttpServer())
      .post('/product/setSpecialPrice')
      .send({ ...updateSpecialPriceDto, price: -1 })
      .expect(400)
      .then(({ body }) => {
        expect(body.message).toContain(negativePriceMessage)
        done();
      });
  });

  // DELETE PRODUCTS

  it('/product/:id Delete product - Success', () => {
    return request(app.getHttpServer())
      .delete('/product/' + productId)
      .expect(200);
  });

  // DELETE CATEGORIES

  it('/category/:id Delete child category - Success', () => {
    return request(app.getHttpServer())
      .delete('/category/' + childCategoryId)
      .expect(200);
  });

  it('/category/:id Delete parent category - Success', () => {
    return request(app.getHttpServer())
      .delete('/category/' + parentCategoryId)
      .expect(200);
  });

  afterAll(() => {
    disconnect();
  });

  // Utils

  function checkStocks(body, done) {
    expect(body.length).toBeGreaterThan(0);
    let stock = 0;
    body.forEach((item) => {
      if (item.articul === productDto.articul) {
        stock = item.stock;
      }
    });
    expect(stock).toEqual(updateStockDto.stock);
    done();
  }
});
