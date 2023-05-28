const winston = require("winston");
const { format } = require("date-fns");
const todoService = require("./todoService");
const Task = require("./classes/task");

const requestLogger = createLogger("requests.log");
const todoLogger = createLogger("todos.log");

let requestNumber = 1;

function createLogger(filename) {
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

async function healthCheck(req, res) {
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

async function createTodo(req, res) {
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

module.exports = {
  healthCheck,
  createTodo,
  createLogger, // Add this line
};