const express = require("express");
const bodyParser = require("body-parser");
const requestHandler = require("./requestHandler");

const app = express();
app.use(bodyParser.json());

app.get("/todo/health", requestHandler.healthCheck);
app.post("/todo", requestHandler.createTodo);

const port = 7583; // Specify the desired port number here

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});