
const express = require("express");
const jwt = require("jsonwebtoken");
const Task = require("../models/Task");
const Project = require("../models/Project");

const router = express.Router();

function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Please log in first" });
    }

    try {
        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

// Create a task in a project
router.post("/", auth, async (req, res) => {
    try {
        const { title, description, projectId, assignedTo } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({
                message: "Task title and projectId are required"
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            members: req.userId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found or you are not a member"
            });
        }


if (assignedTo) {
    const User = require("../models/User");

    const member = await User.findOne({
        email: assignedTo.trim().toLowerCase()
    });

    if (!member) {
        return res.status(400).json({
            message: "No registered user found with this email"
        });
    }

    const projectMemberIds = project.members.map(
        (id) => id.toString()
    );

    const isMember = projectMemberIds.includes(
        member._id.toString()
    );

    if (!isMember) {
        return res.status(400).json({
            message: "Assigned user must be a project member"
        });
    }

    assignedUserId = member._id;
}

const task = await Task.create({
    title,
    description,
    project: projectId,
    createdBy: req.userId,
    assignedTo: assignedUserId
});
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: "Could not create task" });
    }
});

// Get tasks in a project
router.get("/project/:projectId", auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.projectId,
            members: req.userId
        });

        let assignedUserId = null;

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const tasks = await Task.find({
            project: req.params.projectId
        })
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email")
            .populate("comments.user", "name email");

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Could not fetch tasks" });
    }
});

// Delete a task
router.delete("/:id", auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        const project = await Project.findOne({
            _id: task.project,
            members: req.userId
        });

        if (!project) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: "Task deleted successfully!" });
    } catch (error) {
        res.status(500).json({
            message: "Could not delete task"
        });
    }
});

// Update task status
router.patch("/:id/status", auth, async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ["To Do", "In Progress", "Done"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid task status" });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await Project.findOne({
            _id: task.project,
            members: req.userId
        });

        if (!project) {
            return res.status(403).json({ message: "Access denied" });
        }

        task.status = status;
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: "Could not update task" });
    }
});

// Add a comment to a task
router.post("/:id/comments", auth, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Comment cannot be empty" });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await Project.findOne({
            _id: task.project,
            members: req.userId
        });

        if (!project) {
            return res.status(403).json({ message: "Access denied" });
        }

        task.comments.push({
            user: req.userId,
            text: text.trim()
        });

        await task.save();

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: "Could not add comment" });
    }
});

module.exports = router;