import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Dummy list of already registered emails
    const existingUsers = ["test@example.com", "user@example.com"];

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
        setSuccess("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const { name, email, password, confirmPassword } = form;

        if (!name || !email || !password || !confirmPassword) {
            setError("All fields are required.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (existingUsers.includes(email.trim().toLowerCase())) {
            setError("An account with this email already exists.");
            return;
        }

        // Simulate successful signup
        setSuccess("Sign up successful!");
        setTimeout(() => {
      navigate("/form");
    }, 1000);
        setForm({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        });
    };

    const inputStyle = {
        width: "100%",
        padding: "8px",
        marginTop: "4px",
        borderRadius: "4px",
        border: "1px solid #ccc",
    };

    const buttonStyle = {
        width: "100%",
        padding: "10px",
        marginTop: "10px",
        backgroundColor: "#61dafb",
        border: "none",
        color: "#282c34",
        fontWeight: "bold",
        borderRadius: "4px",
        cursor: "pointer",
    };

    return (
        <div style={{ maxWidth: 400, margin: "40px auto", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>Name</label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                </div>

                {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
                {success && <div style={{ color: "green", marginBottom: 12 }}>{success}</div>}

                <button type="submit" style={buttonStyle}>Sign Up</button>
            </form>

            {/* Always show login prompt */}
            <p style={{ marginTop: 16 }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#007bff", textDecoration: "underline" }}>
                    Login here
                </Link>
            </p>
        </div>
    );
}

export default Signup;
