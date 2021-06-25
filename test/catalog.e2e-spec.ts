import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { childCategoryDto, newProductName, parentCategoryDto, productDto } from './catalog.test-entity';

// Mock schedule service
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

  it('/category/:id Get child category - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/category/' + childCategoryId)
      .expect(200)
      .then(({ body }) => {
        expect(body.parentCode).toBeDefined();
        done();
      });
  });

  // CREATE PRODUCTS

  it('/product/post Create product with wrong category - Failed', () => {
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

  it('/product/post Create product with not unique articul - Failed', () => {
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

  // UPDATE PRODUCTS

  it('/product/post (update) - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/product/post')
      .send({ ...productDto, name: newProductName })
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(newProductName);
        done();
      });
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

  // DELETE PRODUCTS

  it('/product/:id Delete product - Success', () => {
    return request(app.getHttpServer())
      .delete('/product/' + productId)
      .expect(200);
  });

  afterAll(() => {
    disconnect();
  });
});
