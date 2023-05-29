// requestHandler.js
const winston = require("winston");
const { format } = require("date-fns");
const todoService = require("./todoService");
const Task = require("./classes/task");
const todoList = todoService.todoList; // Import the todoList array

function loggerCreator(filename, logLevel) {
  const transportOptions = {
    filename,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.metadata(),
      winston.format.printf(({ level, message, metadata }) => {
        const formattedTimestamp = format(
          new Date(metadata.timestamp),
          "dd-MM-yyyy HH:mm:ss.SSS"
        );
        return `[${formattedTimestamp}] ${level.toUpperCase()}: ${message} | request #${metadata.requestNumber}`;
      })
    ),
  };

  return winston.createLogger({
    level: logLevel,
    transports: [
      new winston.transports.Console(transportOptions),
      new winston.transports.File(transportOptions),
    ],
  });
}

const requestLogger = loggerCreator("requests.log", "info");
const todoLogger = loggerCreator("todos.log", "info");

let requestNumber = 1;

function getTodoSize(req, res) {
  const size = todoList.length;
  res.status(200).send({ size });
}

// Health Check
function healthCheck(req, res) {
  const start = Date.now();
  requestLogger.info(
    `Incoming request | #${requestNumber} | resource: /todo/health | HTTP Verb GET`,
    { requestNumber }
  );
  const durationMs = Date.now() - start;
  requestLogger.debug(`request #${requestNumber} duration: ${durationMs}ms`, {
    requestNumber,
  });

  requestNumber++;
  res.status(200).send("OK");
}

// Create Todo
let id = 1;

function createTodo(req, res) {
  const body = req.body;

  const todoExists = todoList.find((item) => item.title === body.title);
  if (todoExists) {
    const errorMessage = `Error: TODO with the title ${body.title} already exists in the system`;
    res.status(409).send({ errorMessage });
    todoLogger.error(errorMessage);
  } else {
    const dueDate = new Date(body.dueDate);

    if (dueDate < Date.now()) {
      const errorMessage = "Error: Can't create new TODO with a due date in the past";
      res.status(409).send({ errorMessage });
      todoLogger.error(errorMessage);
    } else {
      const newTodo = new Task(id++, body.title, body.content, dueDate);
      todoList.push(newTodo);

      todoLogger.info(`Creating new TODO with Title [${body.title}] and ID [${newTodo.getId()}]`);
      todoLogger.debug(`Currently there are ${todoList.length} TODOs in the system.`);

      res.send({ result: newTodo.getId() });
    }
  }
}

// Get Todo Content
// Get Todo Content
function sortTodoArray(todoArray, sortBy) {
  const sortOptions = {
    DUE_DATE: (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    TITLE: (a, b) => a.title.localeCompare(b.title),
  };

  return todoArray.sort(sortOptions[sortBy] || ((a, b) => a.id - b.id));
}

function getTodoContent(req, res) {
  const status = req.query.status;
  const sortBy = req.query.sortBy;

  const validStatusValues = ["ALL", "PENDING", "LATE", "DONE"];
  const validSortByValues = ["ID", "DUE_DATE", "TITLE"];

  if (!validStatusValues.includes(status) || !validSortByValues.includes(sortBy)) {
    todoLogger.error("Bad request.", { requestNumber });
    return res.status(400).send({
      errorMessage: "Bad request.",
    });
  }

  let filteredArray = [];
  if (status === "ALL") {
    filteredArray = todoList;
  } else if (status === "LATE") {
    filteredArray = todoList.filter((item) => item.getDueDate().getTime() < Date.now());
  } else {
    filteredArray = todoList.filter((item) => item.getStatus() === status);
  }

  filteredArray = sortTodoArray(filteredArray, sortBy);

  const result = filteredArray.map((item) => ({
    id: item.getId(),
    title: item.getTitle(),
    content: item.getContent(),
    status: item.getStatus(),
    dueDate: item.getDueDate(),
  }));

  todoLogger.info(`Extracting todos content. Filter: ${status} | Sorting by: ${sortBy}`);
  todoLogger.debug(`There are a total of ${todoList.length} todos in the system. The result holds ${filteredArray.length} todos`);

  res.status(200).send({
    result: result,
  });
}

// Update Todo Status
function updateTodoStatus(req, res) {
  const id = parseInt(req.query.id);
  const status = req.query.status;

  const todo = todoList.find((item) => item.getId() === id);

  if (!todo) {
    const errorMessage = `Error: no such TODO with id ${id}`;
    todoLogger.error(errorMessage, { requestNumber });
    return res.status(404).json({ errorMessage });
  }

  if (!["PENDING", "LATE", "DONE"].includes(status)) {
    const errorMessage = "Error: Invalid status";
    todoLogger.error(errorMessage, { requestNumber });
    return res.status(400).json({ errorMessage });
  }

  const prevStatus = todo.getStatus();
  todo.setStatus(status);

  requestLogger.info(
    `Incoming request | #${requestNumber} | resource: /todo | HTTP Verb PUT`,
    { requestNumber }
  );
  todoLogger.info(
    `Update TODO id [${id}] state to ${status}`,
    { requestNumber }
  );

  requestNumber++;
  res.status(200).json({ result: prevStatus });
}

// Delete Todo
function deleteTodo(req, res) {
  const queryId = req.query.id;
  const parsedId = parseInt(queryId); // convert string to int

  if (queryId === undefined || !Number.isInteger(parsedId)) {
    // check if the id is valid
    todoLogger.error(`Error: invalid TODO id ${queryId}`);
    return res.status(400).json({
      errorMessage: "Error: invalid TODO id " + queryId,
    });
  }

  let spliced = false;
  for (let i = 0; i < todoList.length; i++) {
    if (todoList[i].getId() === parsedId) {
      todoList.splice(i, 1);
      spliced = true;
      break;
    }
  }

  if (spliced) {
    todoLogger.info(`Removing todo id ${queryId}`);
    todoLogger.debug(
      `After removing todo id [${queryId}], there are ${todoList.length} TODOs in the system`
    );
    return res.status(200).json({
      result: todoList.length + "",
    });
  } else {
    todoLogger.error(`Error: no such TODO with id ${queryId}`);
    return res.status(404).json({
      errorMessage: "Error: no such TODO with id " + queryId,
    });
  }
}

module.exports = {
  healthCheck,
  createTodo,
  getTodoSize,
  getTodoContent,
  updateTodoStatus,
  deleteTodo,
  requestLogger,
  todoLogger,
};