const request = require("supertest");
const app = require("../service");

// const { DB } = require("../database/database.js");
const { Role } = require("../model/model.js");

const testUser = {
  name: "pizza diner",
  email: "reg@test.com",
  password: "a",
  roles: [{ role: Role.Admin }],
};
let testUserAuthToken;

beforeAll(async () => {
  testUser.email =
    Math.random()
      .toString(36)
      .substring(2, 12) + "@test.com";
  const registerRes = await request(app)
    .post("/api/auth")
    .send(testUser);
  testUserAuthToken = registerRes.body.token;
});

// jest.mock("../database/database.js", () => ({
//   DB: {
//     addUser: jest.fn().mockResolvedValue({
//       _id: "1",
//       name: "John Doe",
//       email: "john@admin.com",
//       token: "mocked-token",
//       roles: [{ role: "admin" }],
//     }),

//     getMenu: jest.fn().mockResolvedValue([
//       {
//         id: 1,
//         title: "Veggie",
//         image: "pizza1.png",
//         price: 0.0038,
//         description: "A garden of delight",
//       },
//     ]),

//     Role: {
//       Admin: "admin",
//     },
//   },
// }));

// async function createAdminUser() {
//   function randomName() {
//     const names = ["John", "Jane", "Sam", "Alex"];
//     return names[Math.floor(Math.random() * names.length)];
//   }
//   let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
//   user.name = randomName();
//   user.email = user.name + "@admin.com";

//   user = await DB.addUser(user);
//   return { ...user, password: "toomanysecrets" };
// }

test("get menu", async () => {
  const res = await request(app).get("/api/order/menu");
  expect(res.status).toBe(200);
});

test("add menu item", async () => {
  //   const adminUser = await createAdminUser();
  const res = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send({
      id: 1,
      title: "Student",
      description: "No topping, no sauce, just carbs",
      image: "pizza9.png",
      price: 0.0001,
    });
  expect(res.status).toBe(200);
});
