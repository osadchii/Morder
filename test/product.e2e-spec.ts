import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';

describe('Product Controller (e2e)', () => {
  let app: INestApplication;

  let createdId: string;
  const dto = {
    name: 'Test case product',
    erpCode: 'testErpCode',
    barcode: '12',
    isDeleted: false,
    articul: 'test articul',
    categoryCode: '1',
  };
  const updatedName = 'updated test name';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/post (POST) (create) - Success', (done) => {
    return request(app.getHttpServer())
      .post('/product/post')
      .send(dto)
      .expect(200)
      .then(({ body }) => {
        createdId = body._id;
        expect(createdId).toBeDefined();
        done();
      });
  });

  it('/product/getPage (POST) - Success', (done) => {
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

  it('/product/getById/:id - Success', (done) => {
    return request(app.getHttpServer())
      .get('/product/getById/' + createdId)
      .expect(200)
      .then(({ body }) => {
        expect(body.articul).toBeDefined();
        done();
      });
  });

  it('/product/post (update) - Success', (done) => {
    return request(app.getHttpServer())
      .post('/product/post')
      .send({ ...dto, name: updatedName })
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(updatedName);
        done();
      });
  });

  it('/:id {DELETE) - Success', () => {
    return request(app.getHttpServer())
      .delete('/product/' + createdId)
      .expect(200);
  });

  afterAll(() => {
    disconnect();
  });
});
