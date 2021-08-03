import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { mesoTestEntity } from './meso.test-entity';

// Mocking a service using schedule
jest.mock('../src/sbermegamarket/sbermegamarket.feed.service');
jest.mock('../src/yandexmarket/yandexmarket.feed.service');

describe('Meso settings (e2e)', () => {
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

  it('/meso/create Create Meso settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/meso/create')
      .send(mesoTestEntity)
      .expect(201)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/meso/update/:id Update Meso settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/meso/update/' + settingsId)
      .send({
        ...mesoTestEntity,
        active: false,
      })
      .expect(200)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/meso/get Get all Meso settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/meso/get')
      .expect(200)
      .then(({ body }) => {
        expect(body.length > 0);
        done();
      });
  });

  it('/meso/get/:id Get Meso settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/meso/get/' + settingsId)
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(mesoTestEntity.name);
        done();
      });
  });

  it('/meso/delete/:id Delete Meso settings - Success', async (done) => {
    return request(app.getHttpServer())
      .delete('/meso/delete/' + settingsId)
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
