// orderRouter.test.js
const request = require("supertest");
const express = require("express");
const orderRouter = require("./orderRouter");
const DB = require("../database/database");

jest.mock("../database/database");

const app = express();
app.use(express.json());
app.use("/api/order", orderRouter);

beforeAll(async () => {
  await DB.initializeDatabase(); // Make sure you have a connect method in your DB object
  const mockMenu = [
    {
      id: 1,
      title: "Veggie",
      image: "pizza1.png",
      price: 0.0038,
      description: "A garden of delight",
    },
  ];
  DB.getMenu.mockResolvedValue([]);
  DB.addMenuItem.mockResolvedValue(mockMenu);
}); // Reset the mock before each test

afterAll(async () => {
  // Clean up your database connection or other resources
  await DB.close(); // Make sure you have a close method in your DB object
});

test("GET /api/order/menu should return the pizza menu", async () => {
  const mockMenu = [
    {
      id: 1,
      title: "Veggie",
      image: "pizza1.png",
      price: 0.0038,
      description: "A garden of delight",
    },
  ];

  DB.getMenu.mockResolvedValue(mockMenu); // Mock the DB.getMenu method

  const response = await request(app).get("/api/order/menu");
  expect(response.status).toBe(200);
  expect(response.body).toEqual(mockMenu);
});
