import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { mesoTestEntity } from './meso.test-entity';
import { E2EUtil } from './e2e.util';
import { testUser } from './auth.test-entity';

E2EUtil.MockScheduleServices();

describe('Meso settings (e2e)', () => {
  let app: INestApplication;

  let settingsId: string;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    }));
    await app.init();

    const { body } = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser);
    token = body.access_token;
  });

  it('/meso/create Create Meso settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/meso/create')
      .set('Authorization', 'Bearer ' + token)
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
      .set('Authorization', 'Bearer ' + token)
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
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .then(({ body }) => {
        expect(body.length > 0);
        done();
      });
  });

  it('/meso/get/:id Get Meso settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/meso/get/' + settingsId)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(mesoTestEntity.name);
        done();
      });
  });

  it('/meso/delete/:id Delete Meso settings - Success', async (done) => {
    return request(app.getHttpServer())
      .delete('/meso/delete/' + settingsId)
      .set('Authorization', 'Bearer ' + token)
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
