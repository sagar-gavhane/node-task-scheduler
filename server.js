const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Queue = require("bull");

const app = express();
const port = 3000;

mongoose.connect("mongodb://localhost:27017/task_scheduler", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Task = mongoose.model("Task", { url: String, datetime: Date });

const taskQueue = new Queue("taskQueue", {
  redis: { port: 6379, host: "localhost" },
});

app.use(bodyParser.json());

app.post("/schedule", async (req, res) => {
  try {
    const { url, datetime } = req.body;
    const newTask = new Task({ url, datetime });
    await newTask.save();

    // Schedule the task
    await taskQueue.add(
      "executeTask",
      { taskId: newTask._id },
      { delay: new Date(datetime) - new Date() }
    );

    res.status(200).json({ message: "Task scheduled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

taskQueue.process("executeTask", async (job) => {
  const taskId = job.data.taskId;
  const task = await Task.findById(taskId);

  if (task) {
    // Execute the task (replace with your logic)
    console.log(`Executing task: ${task.url} at ${task.datetime}`);
  } else {
    console.error(`Task with ID ${taskId} not found`);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
