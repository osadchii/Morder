import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { wildberriesTestEntity } from './wildberries.test-entity';
import { E2EUtil } from './e2e.util';
import { testUser } from './auth.test-entity';

E2EUtil.MockScheduleServices();

describe('Wildberries settings (e2e)', () => {
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

  it('/wildberries/create Create Wildberries settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/wildberries/create')
      .set('Authorization', 'Bearer ' + token)
      .send(wildberriesTestEntity)
      .expect(201)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/wildberries/update/:id Update Wildberries settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/wildberries/update/' + settingsId)
      .set('Authorization', 'Bearer ' + token)
      .send({
        ...wildberriesTestEntity,
        active: false,
      })
      .expect(200)
      .then(({ body }) => {
        settingsId = body._id;
        expect(settingsId).toBeDefined();
        done();
      });
  });

  it('/wildberries/get Get all Wildberries settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/wildberries/get')
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .then(({ body }) => {
        expect(body.length > 0);
        done();
      });
  });

  it('/wildberries/get/:id Get Wildberries settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/wildberries/get/' + settingsId)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(wildberriesTestEntity.name);
        done();
      });
  });

  it('/wildberries/delete/:id Delete Wildberries settings - Success', async (done) => {
    return request(app.getHttpServer())
      .delete('/wildberries/delete/' + settingsId)
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
