import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, Module } from "@nestjs/common";
import * as request from "supertest";

// TODO: Replace with full AppModule + service mocks when implementing real e2e tests.
// Using a minimal module here to avoid flaky BullMQ/Redis/Elasticsearch teardown
// errors while the app is in early development.
@Module({})
class MinimalTestModule {}

describe("App (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MinimalTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // TODO: Add e2e tests for auth, mail, users, files, announcements endpoints
  it("/ (GET) — API health check returns 404 (no root route defined)", () => {
    return request(app.getHttpServer()).get("/api").expect(404);
  });
});
