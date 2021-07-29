import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { sberMegaMarketDto } from './sbermegamarket.test-entity';

// Mocking a service using schedule
jest.mock('../src/task/task.service');

describe('SberMegaMarket settings (e2e)', () => {
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

  it('/sbermegamarket/create Create SberMegaMarket settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/sbermegamarket/create')
      .send(sberMegaMarketDto)
      .expect(201)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/sbermegamarket/update/:id Update SberMegaMarket settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/sbermegamarket/update/' + settingsId)
      .send({
        ...sberMegaMarketDto,
        active: false,
      })
      .expect(200)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/sbermegamarket/get Get all SberMegaMarket settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/sbermegamarket/get')
      .expect(200)
      .then(({ body }) => {
        expect(body.length > 0);
        done();
      });
  });

  it('/sbermegamarket/get/:id Get SberMegaMarket settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/sbermegamarket/get/' + settingsId)
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(sberMegaMarketDto.name);
        done();
      });
  });

  it('/sbermegamarket/delete/:id Delete SberMegaMarket settings - Success', async (done) => {
    return request(app.getHttpServer())
      .delete('/sbermegamarket/delete/' + settingsId)
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
