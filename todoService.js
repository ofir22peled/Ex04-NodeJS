// todoService.js

const Task = require("./classes/task");

const todoList = [];
let id = 1;

function createTodo({ title, content, dueDate }) {
    return new Promise((resolve, reject) => {
      const taskExists = todoList.find((task) => task.getTitle() === title);
      if (taskExists) {
        const errorMessage = `Error: Task with the title '${title}' already exists`;
        requestHandler.todoLogger.error(errorMessage);
        reject({ statusCode: 400, message: errorMessage });
      } else {
        const task = new Task(id++, title, content, dueDate);
        todoList.push(task);
  
        requestHandler.todoLogger.info(`Task with Title [${task.getTitle()}] created successfully`);
        requestHandler.todoLogger.debug(`There are now ${todoList.length} Tasks in the system`, {
          taskId: task.getId(),
        });
  
        resolve(task);
      }
    });
  }
  

function getTodoCount() {
  return todoList.length;
}

module.exports = {
  todoList, // Export the todoList array
  createTodo,
  getTodoCount,
};