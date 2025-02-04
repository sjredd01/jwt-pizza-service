const request = require("supertest");
const createApp = require("../service");
const { Role, DB } = require("../database/database.js");
const testConfig = require("../test.config.js");

function randomName() {
  return Math.random()
    .toString(36)
    .substring(2, 12);
}

async function createAdminUser(db) {
  let user = { password: "toomanysesecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  await db.addUser(user);

  user.password = "toomany";
  return user;
}

let testUser;
let testUserAuthToken;

let app;

beforeAll(async () => {
  app = await createApp(testConfig);
  const db = new DB(testConfig);
  await createAdminUser(db);
});

test("list franchises", async () => {
  const res = await request(app).get("/api/franchise");
  expect(res.status).toBe(200);
});
