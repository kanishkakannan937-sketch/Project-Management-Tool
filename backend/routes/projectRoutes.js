
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");
const Task = require("../models/Task");

const router = express.Router();

function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Please log in first" });
    }

    try {
        const decoded = jwt.verify(
            header.split(" ")[1],
            process.env.JWT_SECRET
        );
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

// Create project
router.post("/", auth, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Project name is required" });
        }

        const project = await Project.create({
            name: name.trim(),
            description: description || "",
            createdBy: req.userId,
            members: [req.userId]
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: "Could not create project" });
    }
});

// Get my projects
router.get("/", auth, async (req, res) => {
    try {
        const projects = await Project.find({ members: req.userId })
            .populate("createdBy", "name email")
            .populate("members", "name email");

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Could not fetch projects" });
    }
});

// Add a team member by email
router.post("/:id/members", auth, async (req, res) => {
    try {
        const { email } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({ message: "Email is required" });
        }

        const project = await Project.findOne({
            _id: req.params.id,
            createdBy: req.userId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found or only its creator can add members"
            });
        }

        const member = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!member) {
            return res.status(404).json({
                message: "No registered user found with this email"
            });
        }

        if (project.members.some(id => id.toString() === member._id.toString())) {
            return res.status(409).json({
                message: "User is already a project member"
            });
        }

        project.members.push(member._id);
        await project.save();

        res.json({
            message: "Team member added successfully",
            project: await project.populate("members", "name email")
        });
    } catch (error) {
        res.status(500).json({ message: "Could not add team member" });
    }
});

// Delete a project
router.delete("/:id", auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            members: req.userId
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found or access denied"
            });
        }

        await Project.findByIdAndDelete(req.params.id);

        // Delete tasks belonging to this project too
        await Task.deleteMany({
            project: req.params.id
        });

        res.json({
            message: "Project deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            message: "Could not delete project"
        });
    }
});
module.exports = router;