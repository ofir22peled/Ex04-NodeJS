const express = require("express");
const bodyParser = require("body-parser");
const requestHandler = require("./requestHandler");

const app = express();
app.use(bodyParser.json());

app.get("/todo/health", requestHandler.healthCheck);
app.post("/todo", requestHandler.createTodo);
app.get("/todo/size", requestHandler.getTodoSize);
app.get("/todo/content", requestHandler.getTodoContent);
app.put("/todo", requestHandler.updateTodoStatus);
app.delete("/todo", requestHandler.deleteTodo);

const logger = requestHandler.requestLogger;
const levels = ["ERROR", "INFO", "DEBUG"];

app.get("/logs/level", (req, res) => {
  logger.info(`Incoming request | resource: /logs/level | HTTP Verb GET`);
  if (!levels.includes(req.query["logger-level"])) {
    res.status(400).send({
      errorMessage: "Error: no such level"
    });
    return;
  }
  res.status(200).send({ result: logger.level.toUpperCase() });
});

app.put("/logs/level", (req, res) => {
  logger.info(`Incoming request | resource: /logs/level | HTTP Verb PUT`);
  if (!levels.includes(req.query["logger-level"])) {
    res.status(400).send({
      errorMessage: "Error: no such level"
    });
    return;
  }

  logger.level = req.query["logger-level"].toLowerCase();
  res.status(200).send({ result: logger.level.toUpperCase() });
});

app.listen(9583, () => {
  console.log("Server listening on port 9583...");
});
