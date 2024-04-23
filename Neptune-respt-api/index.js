const app = require("./app");
const PORT = parseInt(process.env.PORT) || 8080;

app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
