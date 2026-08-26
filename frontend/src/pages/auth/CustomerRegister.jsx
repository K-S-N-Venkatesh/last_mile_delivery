import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/CustomerRegister.css";

function CustomerRegister() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        customer_type: "B2C",
        business_name: "",
        business_registration_number: "",
        tax_id: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
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
        setSuccess("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Registration failed"
                );
            }

            setSuccess("Registration successful! Redirecting to login...");

            setTimeout(() => {
                navigate("/customer/login");
            }, 1500);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-card">

                <div className="register-header">

                    <Link to="/" className="register-brand">
                        <div className="brand-icon">LM</div>
                        <span>Last Mile</span>
                    </Link>

                    <h1>Create your account</h1>

                    <p>
                        Register as a customer to manage and track your
                        deliveries.
                    </p>

                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div className="form-row">

                        <div className="form-group">
                            <label htmlFor="email">Email</label>

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
                            <label htmlFor="phone">Phone</label>

                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="10-digit phone number"
                                required
                            />
                        </div>

                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="customer_type">
                            Customer Type
                        </label>

                        <select
                            id="customer_type"
                            name="customer_type"
                            value={formData.customer_type}
                            onChange={handleChange}
                        >
                            <option value="B2C">
                                B2C — Individual
                            </option>

                            <option value="B2B">
                                B2B — Business
                            </option>
                        </select>
                    </div>

                    {formData.customer_type === "B2B" && (
                        <div className="business-section">

                            <div className="business-heading">
                                Business Information
                            </div>

                            <div className="form-group">
                                <label htmlFor="business_name">
                                    Business Name
                                </label>

                                <input
                                    id="business_name"
                                    name="business_name"
                                    type="text"
                                    value={formData.business_name}
                                    onChange={handleChange}
                                    placeholder="Enter business name"
                                    required
                                />
                            </div>

                            <div className="form-row">

                                <div className="form-group">
                                    <label htmlFor="business_registration_number">
                                        Registration Number
                                    </label>

                                    <input
                                        id="business_registration_number"
                                        name="business_registration_number"
                                        type="text"
                                        value={
                                            formData.business_registration_number
                                        }
                                        onChange={handleChange}
                                        placeholder="Registration number"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="tax_id">
                                        Tax ID
                                    </label>

                                    <input
                                        id="tax_id"
                                        name="tax_id"
                                        type="text"
                                        value={formData.tax_id}
                                        onChange={handleChange}
                                        placeholder="Tax ID"
                                        required
                                    />
                                </div>

                            </div>

                        </div>
                    )}

                    {error && (
                        <div className="form-message error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="form-message success">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="register-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create Account"}
                    </button>

                </form>

                <div className="login-link">
                    Already have an account?
                    <Link to="/customer/login">
                        Login
                    </Link>
                </div>

            </div>

        </div>
    );
}

export default CustomerRegister;