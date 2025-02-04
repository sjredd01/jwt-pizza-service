const request = require("supertest");
const { Role, DB } = require("../database/database.js");
const testConfig = require("../test.config.js");
const createApp = require("../service");

function randomName() {
  return Math.random()
    .toString(36)
    .substring(2, 12);
}

async function createAdminUser(db) {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  await db.addUser(user);

  user.password = "toomanysecrets";
  return user;
}

let authToken;
let admin;
let app;

beforeAll(async () => {
  if (!testConfig.db.connection.database) {
    testConfig.db.connection.database = randomName();
  }
  app = await createApp(testConfig);

  const db = new DB(testConfig);

  admin = await createAdminUser(db);
  const loginRes = await request(app)
    .put("/api/auth")
    .send(admin);
  authToken = loginRes.body.token;

  await request(app)
    .post("/api/franchise")
    .send({
      name: "Franchise 1",
      admins: [
        {
          email: admin.email,
        },
      ],
    })
    .set("Authorization", `Bearer ${authToken}`);
});

describe("franchiseRouter", () => {
  test("get franchises", async () => {
    const res = await request(app).get("/api/franchise");
    expect(res.status).toBe(200);
  });

  test("get user franchises", async () => {
    const res = await request(app)
      .get(`/api/franchise/${admin.id}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
  });

  // test("create franchise", async () => {
  //   const res = await request(app)
  //     .post("/api/franchise")
  //     .send({
  //       name: "Franchise 2",
  //       admins: [
  //         {
  //           email: admin.email,
  //         },
  //       ],
  //     })
  //     .set("Authorization", `Bearer ${authToken}`);

  //   expect(res.status).toBe(200);
  // });

  test("delete franchise", async () => {
    await request(app)
      .post("/api/franchise")
      .send({
        name: "Franchise 2",
        admins: [
          {
            email: admin.email,
          },
        ],
      })
      .set("Authorization", `Bearer ${authToken}`);

    const res = await request(app)
      .delete("/api/franchise/2")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "franchise deleted" });
  });

  test("create store", async () => {
    const res = await request(app)
      .post("/api/franchise/1/store")
      .send({
        name: "Store 1",
      })
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });

  test("delete store", async () => {
    await request(app)
      .post("/api/franchise/1/store")
      .send({
        name: "Store 2",
      })
      .set("Authorization", `Bearer ${authToken}`);

    const res = await request(app)
      .delete("/api/franchise/1/store/2")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "store deleted" });
  });
});
