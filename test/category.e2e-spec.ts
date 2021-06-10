import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';

describe('CategoryController (e2e)', () => {
  let app: INestApplication;

  let createdId: string;
  const dto = {
    name: 'Test case category',
    erpCode: 'testErpCode',
    isDeleted: false,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/post (POST)', (done) => {
    return request(app.getHttpServer())
      .post('/category/post')
      .send(dto)
      .expect(200)
      .then(({ body }) => {
        createdId = body._id;
        expect(createdId).toBeDefined();
        done();
      });
  });

  it('/category/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/category/')
      .expect(200);
  });

  it('/:id {DELETE)', () => {
    return request(app.getHttpServer())
      .delete('/category/' + createdId)
      .expect(200);
  });

  afterAll(() => {
    disconnect();
  });
});
