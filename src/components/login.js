import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Dummy authentication logic
        if (email === 'user@example.com' && password === 'password') {
            setError('');
            alert('Login successful!');
            // Redirect or further logic here
            setTimeout(() => {
      navigate("/form");
    }, 1000);
        } else {
            setError('Invalid email or password');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '50px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: 8, marginTop: 4 }}
                    />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: 8, marginTop: 4 }}
                    />
                </div>
                {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
                <button type="submit" style={{ width: '100%', padding: 8 }}>Login</button>
            </form>
          
        </div>
    );
}

export default Login;