import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/CustomerLogin.css";
import { loginUser } from "../../services/authService";


function CustomerLogin() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await loginUser(
                formData.email,
                formData.password
            );

            navigate("/customer/dashboard");

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-card">

                <div className="login-header">

                    <Link to="/" className="login-brand">
                        <div className="brand-icon">LM</div>
                        <span>Last Mile</span>
                    </Link>

                    <h1>Welcome back</h1>

                    <p>
                        Sign in to manage and track your deliveries.
                    </p>

                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                </form>

                <div className="register-link">
                    Don't have an account?
                    <Link to="/customer/register">
                        Register
                    </Link>
                </div>

            </div>

        </div>
    );
}

export default CustomerLogin;