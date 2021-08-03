import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { ozonTestEntity } from './ozon.test-entity';

// Mocking a service using schedule
jest.mock('../src/sbermegamarket/sbermegamarket.feed.service');
jest.mock('../src/yandexmarket/yandexmarket.feed.service');

describe('Ozon settings (e2e)', () => {
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

  it('/ozon/create Create Ozon settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/ozon/create')
      .send(ozonTestEntity)
      .expect(201)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/ozon/update/:id Update Ozon settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/ozon/update/' + settingsId)
      .send({
        ...ozonTestEntity,
        active: false,
      })
      .expect(200)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/ozon/get Get all Ozon settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/ozon/get')
      .expect(200)
      .then(({ body }) => {
        expect(body.length > 0);
        done();
      });
  });

  it('/ozon/get/:id Get Ozon settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/ozon/get/' + settingsId)
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(ozonTestEntity.name);
        done();
      });
  });

  it('/ozon/delete/:id Delete Ozon settings - Success', async (done) => {
    return request(app.getHttpServer())
      .delete('/ozon/delete/' + settingsId)
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
