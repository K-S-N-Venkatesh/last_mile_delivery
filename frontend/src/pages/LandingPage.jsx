import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

function LandingPage() {
    return (
        <div className="landing-page">

            <header className="landing-header">
                <div className="brand">
                    <div className="brand-icon">LM</div>
                    <span>Last Mile</span>
                </div>

                <div className="header-actions">
                    <Link to="/admin/login" className="admin-link">
                        Admin Login
                    </Link>
                </div>
            </header>

            <main className="landing-main">

                <section className="hero-section">

                    <div className="hero-content">
                        <span className="hero-badge">
                            DELIVERY MANAGEMENT PLATFORM
                        </span>

                        <h1>
                            Deliver smarter.
                            <br />
                            <span>Move faster.</span>
                        </h1>

                        <p>
                            A reliable last-mile delivery platform designed to
                            simplify order management, agent operations and
                            customer deliveries.
                        </p>
                    </div>

                    <div className="role-selection">

                        <div className="role-card">
                            <div className="role-icon customer-icon">
                                C
                            </div>

                            <div className="role-content">
                                <h2>Customer</h2>

                                <p>
                                    Create shipments, manage orders and track
                                    your deliveries.
                                </p>

                                <div className="role-actions">
                                    <Link
                                        to="/customer/login"
                                        className="btn btn-primary"
                                    >
                                        Login
                                    </Link>

                                    <Link
                                        to="/customer/register"
                                        className="btn btn-secondary"
                                    >
                                        Register
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="role-card">
                            <div className="role-icon agent-icon">
                                A
                            </div>

                            <div className="role-content">
                                <h2>Delivery Agent</h2>

                                <p>
                                    Manage assigned deliveries, update order
                                    status and handle COD collections.
                                </p>

                                <div className="role-actions">
                                    <Link
                                        to="/agent/login"
                                        className="btn btn-primary"
                                    >
                                        Login
                                    </Link>

                                    <Link
                                        to="/agent/register"
                                        className="btn btn-secondary"
                                    >
                                        Register
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>

                </section>

                <section className="features-section">

                    <div className="feature">
                        <div className="feature-number">01</div>
                        <div>
                            <h3>Smart Pricing</h3>
                            <p>
                                Automated pricing based on zones, weight,
                                delivery type and COD.
                            </p>
                        </div>
                    </div>

                    <div className="feature">
                        <div className="feature-number">02</div>
                        <div>
                            <h3>Real-time Tracking</h3>
                            <p>
                                Track shipments through every stage of the
                                delivery lifecycle.
                            </p>
                        </div>
                    </div>

                    <div className="feature">
                        <div className="feature-number">03</div>
                        <div>
                            <h3>Reliable Operations</h3>
                            <p>
                                Agent assignment, rescheduling and delivery
                                management in one platform.
                            </p>
                        </div>
                    </div>

                </section>

            </main>

            <footer className="landing-footer">
                <span>© 2026 Last Mile</span>
                <span>Delivery Management System</span>
            </footer>

        </div>
    );
}

export default LandingPage;