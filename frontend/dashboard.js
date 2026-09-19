
const API_URL = "https://project-management-tool-2shj.onrender.com/api";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token) {
    window.location.href = "login.html";
}

const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
};

const projectList = document.getElementById("projectList");
const projectForm = document.getElementById("projectForm");
const taskForm = document.getElementById("taskForm");

const projectMessage = document.getElementById("projectMessage");
const taskMessage = document.getElementById("taskMessage");

const memberForm = document.getElementById("memberForm");
const memberMessage = document.getElementById("memberMessage");

const taskSection = document.getElementById("tasks");
const taskList = document.getElementById("taskList");

let selectedProjectId = null;
let projects = [];

// Display logged-in user
const userNameElement = document.getElementById("userName");

if (userNameElement && user) {
    userNameElement.textContent = user.name || user.email;
}

// API helper
async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...authHeaders,
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || data.error || "Something went wrong");
    }

    return data;
}

// Create project
if (projectForm) {
    projectForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("projectName").value.trim();
        const description = document
            .getElementById("projectDescription")
            .value.trim();

        if (!name) {
            projectMessage.textContent = "Please enter a project name.";
            return;
        }

        try {
            await apiRequest("/projects", {
                method: "POST",
                body: JSON.stringify({ name, description })
            });

            projectMessage.textContent = "Project created successfully!";
            projectForm.reset();

            await loadProjects();
        } catch (error) {
            projectMessage.textContent = error.message;
        }
    });
}

// Load projects

// Load projects
async function loadProjects() {
    try {
        projects = await apiRequest("/projects");

        if (!Array.isArray(projects)) {
            projects = projects.projects || [];
        }

        projectList.innerHTML = "";

        if (projects.length === 0) {
            projectList.innerHTML = "<p>No projects yet. Create one!</p>";
            return;
        }

        projects.forEach((project) => {
            const card = document.createElement("div");
            card.className = "project-card";

            const title = document.createElement("h3");
            title.textContent = project.name;

            const description = document.createElement("p");
            description.textContent =
                project.description || "No description provided.";

            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.textContent = "Open Project";

            openButton.addEventListener("click", () => {
                selectProject(project);
            });

            // Delete Project button
            const deleteProjectButton =
                document.createElement("button");

            deleteProjectButton.type = "button";
            deleteProjectButton.textContent = "Delete Project";

            deleteProjectButton.addEventListener(
                "click",
                async () => {
                    const confirmed = confirm(
                        `Delete project "${project.name}" and all its tasks?`
                    );

                    if (!confirmed) return;

                    try {
                        await apiRequest(
                            `/projects/${project._id}`,
                            { method: "DELETE" }
                        );

                        if (selectedProjectId === project._id) {
                            selectedProjectId = null;
                            taskList.innerHTML = "";
                        }

                        await loadProjects();
                    } catch (error) {
                        alert(error.message);
                    }
                }
            );

            card.append(
                title,
                description,
                openButton,
                deleteProjectButton
            );

            projectList.appendChild(card);
        });

    } catch (error) {
        projectList.innerHTML = `<p>${error.message}</p>`;
    }
}

// Select project
async function selectProject(project) {
    selectedProjectId = project._id;

    const selectedProjectInput =
        document.getElementById("selectedProjectId");
    const taskHint =
        document.getElementById("taskHint");
    const taskList =
        document.getElementById("taskList");
    const tasksSection =
        document.getElementById("tasks");

    if (selectedProjectInput) {
        selectedProjectInput.value = selectedProjectId;
    }

    if (taskHint) {
        taskHint.textContent = `Selected project: ${project.name}`;
    }

    if (taskList) {
        taskList.innerHTML = "Loading tasks...";
    }

    if (tasksSection) {
        tasksSection.scrollIntoView({ behavior: "smooth" });
    }

    if (memberMessage) {
        memberMessage.textContent = "";
    }

    await loadTasks();
}

// Add team member to selected project
if (memberForm) {
    memberForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!selectedProjectId) {
            memberMessage.textContent = "Please open a project first.";
            return;
        }

        const email = document
            .getElementById("memberEmail")
            .value.trim()
            .toLowerCase();

        try {
            await apiRequest(`/projects/${selectedProjectId}/members`, {
                method: "POST",
                body: JSON.stringify({ email })
            });

            memberMessage.textContent = "Team member added successfully!";
            memberForm.reset();
        } catch (error) {
            memberMessage.textContent = error.message;
        }
    });
}

// Create task
if (taskForm) {
    taskForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!selectedProjectId) {
            taskMessage.textContent = "Please open a project first.";
            return;
        }

        const title = document.getElementById("taskTitle").value.trim();
        const description = document
            .getElementById("taskDescription")
            .value.trim();

        const assignedTo = document
            .getElementById("assignedTo")
            .value.trim()
            .toLowerCase();

        if (!title) {
            taskMessage.textContent = "Please enter a task title.";
            return;
        }

        try {
            await apiRequest("/tasks", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    description,
                    projectId: selectedProjectId,
                    assignedTo
                })
            });

            taskMessage.textContent = "Task created successfully!";
            taskForm.reset();

            await loadTasks();
        } catch (error) {
            taskMessage.textContent = error.message;
        }
    });
}

// Load tasks for selected project
async function loadTasks() {
    if (!selectedProjectId) return;

    try {
        const tasks = await apiRequest(
            `/tasks/project/${selectedProjectId}`
        );

        taskList.innerHTML = "";

        if (!Array.isArray(tasks) || tasks.length === 0) {
            taskList.innerHTML = "<p>No tasks in this project yet.</p>";
            updateStats([]);
            return;
        }

        tasks.forEach((task) => {
            const card = document.createElement("div");
            card.className = "task-card";

            const title = document.createElement("h3");
            title.textContent = task.title;

            const description = document.createElement("p");
            description.textContent =
                task.description || "No description provided.";

            const assigned = document.createElement("p");
            assigned.textContent = task.assignedTo
                ? `Assigned to: ${task.assignedTo.name || task.assignedTo.email}`
                : "Unassigned";

            const statusLabel = document.createElement("label");
            statusLabel.textContent = "Status: ";

            const statusSelect = document.createElement("select");

            ["To Do", "In Progress", "Done"].forEach((status) => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                statusSelect.appendChild(option);
            });

            statusSelect.value = task.status || "To Do";

            statusSelect.addEventListener("change", async () => {
                try {
                    await apiRequest(`/tasks/${task._id}/status`, {
                        method: "PATCH",
                        body: JSON.stringify({
                            status: statusSelect.value
                        })
                    });

                    await loadTasks();
                } catch (error) {
                    alert(error.message);
                }
            });

            statusLabel.appendChild(statusSelect);

            // Comments
            const commentsHeading = document.createElement("h4");
            commentsHeading.textContent = "Comments";

            const commentsContainer = document.createElement("div");
            commentsContainer.className = "comments-list";

            (task.comments || []).forEach((comment) => {
                const commentItem = document.createElement("p");

                const commenter =
                    comment.user?.name ||
                    comment.user?.email ||
                    "User";

                commentItem.textContent =
                    `${commenter}: ${comment.text}`;

                commentsContainer.appendChild(commentItem);
            });

            const commentForm = document.createElement("form");
            commentForm.className = "comment-form";

            const commentInput = document.createElement("input");
            commentInput.type = "text";
            commentInput.placeholder = "Write a comment...";
            commentInput.required = true;

            const commentButton = document.createElement("button");
            commentButton.type = "submit";
            commentButton.textContent = "Add Comment";

            commentForm.append(commentInput, commentButton);

            commentForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                const text = commentInput.value.trim();

                if (!text) return;

                try {
                    await apiRequest(`/tasks/${task._id}/comments`, {
                        method: "POST",
                        body: JSON.stringify({ text })
                    });

                    await loadTasks();
                } catch (error) {
                    alert(error.message);
                }
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete Task";

            deleteButton.addEventListener("click", async () => {
              const confirmed = confirm("Are you sure you want to delete this task?");
              if (!confirmed) return;

              try {
                  await apiRequest(`/tasks/${task._id}`, {
                    method: "DELETE"
                });

                await loadTasks();
           } catch (error) {
              alert(error.message);
           }
        });

        card.append(
            title,
            description,
            assigned,
            statusLabel,
            deleteButton,
            commentsHeading,
            commentsContainer,
            commentForm
        );
            taskList.appendChild(card);
        });

        updateStats(tasks);
    } catch (error) {
        taskList.innerHTML = `<p>${error.message}</p>`;
    }
}

// Update dashboard statistics
function updateStats(tasks) {
    const totalTasksElement = document.getElementById("TaskCount");
    const completedTasksElement = document.getElementById("completedTasks");

    if (totalTasksElement) {
        totalTasksElement.textContent = tasks.length;
    }

    if (completedTasksElement) {
        completedTasksElement.textContent = tasks.filter(
            (task) => task.status === "Done"
        ).length;
    }
}

// Logout
const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });
}

// Initial load
if (token) {
    loadProjects();
}