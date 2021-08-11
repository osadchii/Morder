import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { aliexpressTestEntity } from './aliexpress.test-entity';
import { E2EUtil } from './e2e.util';
import { testUser } from './auth.test-entity';

E2EUtil.MockScheduleServices();

describe('Aliexpress settings (e2e)', () => {
  let app: INestApplication;
  let token: string;

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

    const { body } = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser);
    token = body.access_token;
  });

  it('/aliexpress/create Create Aliexpress settings - Success', async (done) => {
    return request(app.getHttpServer())
      .post('/aliexpress/create')
      .send(aliexpressTestEntity)
      .set('Authorization', 'Bearer ' + token)
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
      .set('Authorization', 'Bearer ' + token)
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
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .then(({ body }) => {
        expect(body.length > 0);
        done();
      });
  });

  it('/aliexpress/get/:id Get Aliexpress settings - Success', async (done) => {
    return request(app.getHttpServer())
      .get('/aliexpress/get/' + settingsId)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .then(({ body }) => {
        expect(body.name).toEqual(aliexpressTestEntity.name);
        done();
      });
  });

  it('/aliexpress/delete/:id Delete Aliexpress settings - Success', async (done) => {
    return request(app.getHttpServer())
      .delete('/aliexpress/delete/' + settingsId)
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
