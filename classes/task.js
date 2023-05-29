//classes/.task.js
class Task {
    constructor(id, title, content, dueDate) {
      this.id = id;
      this.title = title;
      this.content = content;
      this.due_date = dueDate;
      this.status = "PENDING";
    }
  
    getId() {
      return this.id;
    }
  
    getTitle() {
      return this.title;
    }
  
    getContent() {
      return this.content;
    }
  
    getDueDate() {
      return this.due_date;
    }
  
    getStatus() {
      return this.status;
    }
  
    setStatus(status) {
      this.status = status;
    }
  }
  
  module.exports = Task;