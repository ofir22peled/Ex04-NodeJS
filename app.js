const express = require("express");
const bodyParser = require("body-parser");
const requestHandler = require("./requestHandler");

const app = express();
app.use(bodyParser.json());

app.get("/todo/health", requestHandler.healthCheck);
app.post("/todo", requestHandler.createTodo);

// New Routes
app.get("/todo/size", (req, res) => {
  requestHandler.getTodoSize(req, res);
});

app.get("/todo/content", (req, res) => {
  requestHandler.getTodoContent(req, res);
});

app.put("/todo", (req, res) => {
  requestHandler.updateTodoStatus(req, res);
});

app.delete("/todo", (req, res) => {
  requestHandler.deleteTodo(req, res);
});

const port = 9583; // Specify the desired port number here

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});