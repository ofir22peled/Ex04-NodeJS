const requestHandler = require("./requestHandler"); // Add this line

const todoLogger = requestHandler.createLogger("todos.log"); // Update this line

const todoList = [];
let id = 1;

function createTodo({ title, content, dueDate }) {
  return new Promise((resolve, reject) => {
    if (todoList.some((todo) => todo.getTitle() === title)) {
      const errorMessage = `Error: Task with the title ${title} already exists`;
      todoLogger.error(errorMessage);
      reject({ statusCode: 400, message: errorMessage });
    } else {
      const task = new Task(id++, title, content, dueDate);
      todoList.push(task);

      todoLogger.info(`Task with Title [${task.getTitle()}] created successfully`);
      todoLogger.debug(
        `There are now ${todoList.length} Tasks in the system`,
        { taskId: task.getId() }
      );

      resolve(task);
    }
  });
}

function getTodoCount() {
  return todoList.length;
}

module.exports = {
  createTodo,
  getTodoCount,
};