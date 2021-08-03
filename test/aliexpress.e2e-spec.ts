import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { aliexpressTestEntity } from './aliexpress.test-entity';

// Mocking a service using schedule
jest.mock('../src/sbermegamarket/sbermegamarket.feed.service');
jest.mock('../src/yandexmarket/yandexmarket.feed.service');

describe('Aliexpress settings (e2e)', () => {
  let app: INestApplication;

  let settingsId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    }));
    await app.init();
  });

  it('/aliexpress/create Create Aliexpress settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/aliexpress/create')
      .send(aliexpressTestEntity)
      .expect(201)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/aliexpress/update/:id Update Aliexpress settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/aliexpress/update/' + settingsId)
      .send({
        ...aliexpressTestEntity,
        active: false,
      })
      .expect(200)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/aliexpress/get Get all Aliexpress settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/aliexpress/get')
      .expect(200)
      .then(({ body }) => {
        expect(body.length > 0);
        done();
      });
  });

  it('/aliexpress/get/:id Get Aliexpress settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/aliexpress/get/' + settingsId)
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(aliexpressTestEntity.name);
        done();
      });
  });

  it('/aliexpress/delete/:id Delete Aliexpress settings - Success', async (done) => {
    return request(app.getHttpServer())
      .delete('/aliexpress/delete/' + settingsId)
      .expect(200)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  afterAll(() => {
    disconnect();
  });
});
