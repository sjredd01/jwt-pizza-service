const createApp = require("./service.js");
const config = require("./config.js");

(async () => {
  try {
    const app = await createApp(config);

    const port = process.argv[2] || 3000;
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error(error);
  }
})();
