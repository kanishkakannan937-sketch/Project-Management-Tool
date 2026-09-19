
const API_URL = "http://localhost:5002/api";

const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Registration failed";
            return;
        }

        message.textContent = "Registration successful! You can now log in.";
        registerForm.reset();
    } catch (error) {
        message.textContent = "Cannot connect to server. Please try again.";
    }
});