import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiRequest from "../../services/api";
import { getCurrentUser, logoutUser } from "../../services/authService";
import "../../styles/CustomerDashboard.css";

function CustomerDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = getCurrentUser();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await apiRequest("/orders");
                setOrders(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const handleLogout = () => {
        logoutUser();
        window.location.href = "/customer/login";
    };

    const activeOrders = orders.filter(
        (order) =>
            !["DELIVERED", "CANCELLED", "FAILED"].includes(order.status)
    );

    const deliveredOrders = orders.filter(
        (order) => order.status === "DELIVERED"
    );

    return (
        <div className="dashboard-page">

            <header className="dashboard-header">

                <Link to="/" className="dashboard-brand">
                    <div className="brand-icon">LM</div>
                    <span>Last Mile</span>
                </Link>

                <div className="dashboard-user">

                    <span>
                        {user?.name || "Customer"}
                    </span>

                    <button onClick={handleLogout}>
                        Logout
                    </button>

                </div>

            </header>

            <main className="dashboard-content">

                <div className="welcome-section">

                    <div>
                        <h1>
                            Welcome back, {user?.name || "Customer"} 👋
                        </h1>

                        <p>
                            Manage and track your deliveries from one place.
                        </p>
                    </div>

                    <Link
                        to="/customer/orders/create"
                        className="create-order-button"
                    >
                        + Create Order
                    </Link>

                </div>

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                <section className="stats-grid">

                    <div className="stat-card">
                        <span>Total Orders</span>
                        <strong>{orders.length}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Active Orders</span>
                        <strong>{activeOrders.length}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Delivered</span>
                        <strong>{deliveredOrders.length}</strong>
                    </div>

                </section>

                <section className="orders-section">

                    <div className="section-header">

                        <div>
                            <h2>Recent Orders</h2>
                            <p>Your latest delivery activity</p>
                        </div>

                        <Link to="/customer/orders">
                            View all
                        </Link>

                    </div>

                    {loading ? (
                        <div className="empty-state">
                            Loading your orders...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="empty-state">
                            <h3>No orders yet</h3>
                            <p>
                                Create your first delivery order to get started.
                            </p>

                            <Link
                                to="/customer/orders/create"
                                className="empty-action"
                            >
                                Create your first order
                            </Link>
                        </div>
                    ) : (
                        <div className="orders-list">

                            {orders.slice(0, 5).map((order) => (

                                <div
                                    className="order-row"
                                    key={order.id}
                                >

                                    <div className="order-main">

                                        <strong>
                                            Order #{order.id}
                                        </strong>

                                        <span>
                                            {order.order_type} ·{" "}
                                            {order.payment_type}
                                        </span>

                                    </div>

                                    <div className="order-price">
                                        ₹{Number(order.total_charge).toFixed(2)}
                                    </div>

                                    <div
                                        className={`order-status status-${order.status.toLowerCase()}`}
                                    >
                                        {order.status.replaceAll("_", " ")}
                                    </div>

                                </div>

                            ))}

                        </div>
                    )}

                </section>

            </main>

        </div>
    );
}

export default CustomerDashboard;