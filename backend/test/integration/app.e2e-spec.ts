import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Expense Report — E2E', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let reportId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('POST /auth/signup — creates user', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect(201);
  });

  it('POST /auth/login — returns token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect(200);
    userToken = res.body.accessToken;
    expect(userToken).toBeDefined();
  });

  it('POST /reports — creates DRAFT report', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Business Trip Q1' })
      .expect(201);
    reportId = res.body.id;
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.totalAmount).toBe(0);
  });

  it('POST /reports/:id/items — adds item to DRAFT report', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${reportId}/items`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 150.00, category: 'TRAVEL', merchantName: 'Air France' })
      .expect(201);
  });

  it('GET /reports/:id — totalAmount reflects items', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/reports/${reportId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(Number(res.body.totalAmount)).toBe(150);
  });

  it('POST /reports/:id/submit — DRAFT → SUBMITTED', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);
    expect(res.body.status).toBe('SUBMITTED');
  });

  it('POST /reports/:id/items — blocked when SUBMITTED (422)', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${reportId}/items`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 50, category: 'MEALS' })
      .expect(422);
  });

  // Admin happy path
  it('Admin login', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@gradion.com', password: 'admin1234' })
      .expect(200);
    adminToken = res.body.accessToken;
  });

  it('POST /admin/reports/:id/approve — SUBMITTED → APPROVED', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/reports/${reportId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(res.body.status).toBe('APPROVED');
  });

  // Rejection path
  it('Full rejection path: DRAFT → SUBMITTED → REJECTED → DRAFT → SUBMITTED → APPROVED', async () => {
    // Create new report
    const r = await request(app.getHttpServer())
      .post('/api/v1/reports').set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Rejection test' }).expect(201);
    const rId = r.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/reports/${rId}/submit`).set('Authorization', `Bearer ${userToken}`).expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/reports/${rId}/reject`).set('Authorization', `Bearer ${adminToken}`).expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/reports/${rId}/return-to-draft`).set('Authorization', `Bearer ${userToken}`)
      .expect(res => expect(res.body.status).toBe('DRAFT'));

    await request(app.getHttpServer())
      .post(`/api/v1/reports/${rId}/submit`).set('Authorization', `Bearer ${userToken}`).expect(201);

    const approved = await request(app.getHttpServer())
      .post(`/api/v1/admin/reports/${rId}/approve`).set('Authorization', `Bearer ${adminToken}`).expect(201);
    expect(approved.body.status).toBe('APPROVED');
  });
});
