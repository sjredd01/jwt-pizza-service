module.exports = {
  jwtSecret: "anything",
  db: {
    connection: {
      host: "localhost",
      user: "root",
      password: "password",
      database: "pizza",
      connectTimeout: 60000,
    },
    listPerPage: 10,
  },
  factory: {
    url: "https://pizza-factory.cs329.click",
    apiKey: "0293bf70a1d04375b1b7777d8038db70",
  },
};
