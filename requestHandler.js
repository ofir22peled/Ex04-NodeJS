const winston = require("winston");
const { format } = require("date-fns");
const todoService = require("./todoService");
const Task = require("./classes/task");

function loggerCreator(filename) {
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
    level: "info",
    transports: [
      new winston.transports.Console(transportOptions),
      new winston.transports.File(transportOptions),
    ],
  });
}

const requestLogger = loggerCreator("requests.log"); // Update this line
const todoLogger = loggerCreator("todos.log"); // Update this line

let requestNumber = 1;

//1
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

 function createTodo(req, res) {
  const start = Date.now();
  requestLogger.info(
    `Incoming request | #${requestNumber} | resource: /todo | HTTP Verb POST`,
    { requestNumber }
  );

  const { title, content, dueDate } = req.body;

  try {
    const task = new Task(requestNumber, title, content, dueDate);

    const durationMs = Date.now() - start;
    requestLogger.debug(`request #${requestNumber} duration: ${durationMs}ms`, {
      requestNumber,
    });

    todoLogger.info(`Creating new Task with Title [${task.getTitle()}]`, {
      requestNumber,
    });
    todoLogger.debug(
      `Currently there are ${todoService.getTodoCount()} Tasks in the system. New Task will be assigned with id ${task.getId()}`,
      { requestNumber }
    );

    requestNumber++;
    res.status(201).send(task);
  } catch (error) {
    res.status(error.statusCode || 500).send({ error: error.message });
  }
}

// 3 - Get the size of the todo list based on status
function getTodoSize(req, res) {
  const status = req.query.status;

  if (
    status !== "ALL" &&
    status !== "PENDING" &&
    status !== "LATE" &&
    status !== "DONE"
  ) {
    return res.status(400).send(
      JSON.stringify({
        errorMessage: "Bad request.",
      })
    );
  } else {
    if (status === "ALL") {
      return res.status(200).send(
        JSON.stringify({
          result: todoService.getTodoCount(),
        })
      );
    } else {
      const filteredArray = todoList.filter((item) => {
        return item.getStatus() === status;
      });
      return res.status(200).send(
        JSON.stringify({
          result: filteredArray.length,
        })
      );
    }
  }
}

// 4 - Get TODOs data based on status and sort order
function getTodoContent(req, res) {
  const status = req.query.status;
  const sortBy = req.query.sortBy;

  if (
    status !== "ALL" &&
    status !== "PENDING" &&
    status !== "LATE" &&
    status !== "DONE"
  ) {
    return res.status(400).send(
      JSON.stringify({
        errorMessage: "Bad request.",
      })
    );
  }

  let filteredArray = [];
  if (status === "ALL") {
    filteredArray = todoList;
  } else {
    filteredArray = todoList.filter((item) => item.getStatus() === status);
  }

  if (sortBy === "ID") {
    filteredArray.sort((a, b) => a.getId() - b.getId());
  } else if (sortBy === "DUE_DATE") {
    filteredArray.sort((a, b) => a.getDueDate() - b.getDueDate());
  } else if (sortBy === "TITLE") {
    filteredArray.sort((a, b) => {
      if (a.getTitle() < b.getTitle()) {
        return -1;
      } else if (a.getTitle() > b.getTitle()) {
        return 1;
      } else {
        return 0;
      }
    });
  } else if (sortBy) {
    return res.status(400).send(
      JSON.stringify({
        errorMessage: "Bad request.",
      })
    );
  }

  const result = filteredArray.map((item) => ({
    id: item.getId(),
    title: item.getTitle(),
    content: item.getContent(),
    status: item.getStatus(),
    dueDate: item.getDueDate(),
  }));

  res.status(200).send(
    JSON.stringify({
      result: result,
    })
  );
}

// 5 - Update TODO status
function updateTodoStatus(req, res) {
  const id = req.query.id;
  const status = req.query.status;

  const todo = todoList.find((item) => {
    return item.getId() == id;
  });

  if (!todo) {
    res.status(404).send(
      JSON.stringify({
        errorMessage: `Error: no such TODO with id ${id}`,
      })
    );
    return;
  }

  if (status !== "PENDING" && status !== "LATE" && status !== "DONE") {
    res.status(400).send(
      JSON.stringify({
        errorMessage: "Bad request.",
      })
    );
    return;
  }

  const oldStatus = todo.getStatus();
  todo.setStatus(status);

  res.status(200).send(
    JSON.stringify({
      result: oldStatus,
    })
  );
}

// 6 - Delete TODO
function deleteTodo(req, res) {
  const query_id = req.query.id;
  const parsed_id = parseInt(query_id); // convert string to int

  if (query_id === undefined || !Number.isInteger(parsed_id)) {
    // check if the id is valid
    return res.status(400).json({
      errorMessage: "Error: invalid TODO id " + query_id,
    });
  }

  let spliced = false;
  for (let i = 0; i < todoList.length; i++) {
    if (todoList[i].getId() == parsed_id) {
      todoList.splice(i, 1);
      spliced = true;
      break;
    }
  }

  if (spliced) {
    return res.status(200).send(
      JSON.stringify({
        result: todoList.length + "",
      })
    );
  } else {
    return res.status(404).send(
      JSON.stringify({
        errorMessage: "Error: no such TODO with id " + query_id,
      })
    );
  }
}

module.exports = {
  healthCheck,
  createTodo,
  getTodoSize,
  getTodoContent,
  updateTodoStatus,
  deleteTodo,
  loggerCreator, // Add this line
};