import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { yandexMarketDto } from './yandexmarket.test-entity';

// Mocking a service using schedule
jest.mock('../src/sbermegamarket/sbermegamarket.feed.service');
jest.mock('../src/yandexmarket/yandexmarket.feed.service');

describe('YandexMarket settings (e2e)', () => {
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

  it('/yandexmarket/create Create YandexMarket settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/yandexmarket/create')
      .send(yandexMarketDto)
      .expect(201)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/yandexmarket/update/:id Update YandexMarket settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/yandexmarket/update/' + settingsId)
      .send({
        ...yandexMarketDto,
        active: false,
      })
      .expect(200)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/yandexmarket/get Get all YandexMarket settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/yandexmarket/get')
      .expect(200)
      .then(({ body }) => {
        expect(body.length > 0);
        done();
      });
  });

  it('/yandexmarket/get/:id Get YandexMarket settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/yandexmarket/get/' + settingsId)
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(yandexMarketDto.name);
        done();
      });
  });

  it('/yandexmarket/delete/:id Delete YandexMarket settings - Success', async (done) => {
    return request(app.getHttpServer())
      .delete('/yandexmarket/delete/' + settingsId)
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
