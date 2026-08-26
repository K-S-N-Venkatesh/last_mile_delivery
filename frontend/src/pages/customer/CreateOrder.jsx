import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiRequest from "../../services/api";
import "../../styles/CreateOrder.css";

function CreateOrder() {
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(true);

    const [formData, setFormData] = useState({
        pickup_address_id: "",
        delivery_address_id: "",
        length_cm: "",
        width_cm: "",
        height_cm: "",
        actual_weight_kg: "",
        payment_type: "PREPAID"
    });

    const [items, setItems] = useState([
        {
            product_name: "",
            quantity: 1,
            unit_price: ""
        }
    ]);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [pricing, setPricing] = useState(null);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const data = await apiRequest("/addresses");
                setAddresses(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoadingAddresses(false);
            }
        };

        fetchAddresses();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleItemChange = (index, event) => {
        const { name, value } = event.target;

        setItems((previous) =>
            previous.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                        ...item,
                        [name]: value
                    }
                    : item
            )
        );
    };

    const addItem = () => {
        setItems((previous) => [
            ...previous,
            {
                product_name: "",
                quantity: 1,
                unit_price: ""
            }
        ]);
    };

    const removeItem = (index) => {
        if (items.length === 1) {
            return;
        }

        setItems((previous) =>
            previous.filter(
                (_, itemIndex) => itemIndex !== index
            )
        );
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setPricing(null);

        if (
            formData.pickup_address_id ===
            formData.delivery_address_id
        ) {
            setError(
                "Pickup and delivery addresses must be different."
            );
            return;
        }

        setLoading(true);

        try {
            const data = await apiRequest(
                "/orders",
                {
                    method: "POST",
                    body: JSON.stringify({
                        pickup_address_id:
                            Number(formData.pickup_address_id),

                        delivery_address_id:
                            Number(formData.delivery_address_id),

                        length_cm:
                            Number(formData.length_cm),

                        width_cm:
                            Number(formData.width_cm),

                        height_cm:
                            Number(formData.height_cm),

                        actual_weight_kg:
                            Number(formData.actual_weight_kg),
                        
                        payment_type:
                            formData.payment_type,

                        items: items.map((item) => ({
                            product_name:
                                item.product_name,

                            quantity:
                                Number(item.quantity),

                            unit_price:
                                Number(item.unit_price)
                        }))
                    })
                }
            );

            setPricing(data.pricing);

            setSuccess(
                `Order #${data.orderId} created successfully.`
            );

            setTimeout(() => {
                navigate("/customer/dashboard");
            }, 2500);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingAddresses) {
        return (
            <div className="create-order-page">
                <div className="create-order-loading">
                    Loading your addresses...
                </div>
            </div>
        );
    }

    return (
        <div className="create-order-page">

            <header className="create-order-header">

                <Link
                    to="/customer/dashboard"
                    className="create-order-brand"
                >
                    <div className="brand-icon">LM</div>
                    <span>Last Mile</span>
                </Link>

                <Link
                    to="/customer/dashboard"
                    className="back-link"
                >
                    ← Dashboard
                </Link>

            </header>

            <main className="create-order-content">

                <div className="page-heading">
                    <h1>Create Delivery Order</h1>

                    <p>
                        Enter your package details and delivery
                        information.
                    </p>
                </div>

                {addresses.length === 0 ? (

                    <div className="no-address-card">

                        <h2>No saved addresses</h2>

                        <p>
                            You need at least two addresses before
                            creating an order.
                        </p>

                        <Link
                            to="/customer/addresses"
                            className="primary-button"
                        >
                            Add Address
                        </Link>

                    </div>

                ) : (

                    <form
                        className="order-form"
                        onSubmit={handleSubmit}
                    >

                        {/* ADDRESSES */}

                        <section className="form-section">

                            <div className="section-title">
                                <span>01</span>
                                <div>
                                    <h2>Delivery Addresses</h2>
                                    <p>
                                        Choose where the package is
                                        picked up and delivered.
                                    </p>
                                </div>
                            </div>

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Pickup Address
                                    </label>

                                    <select
                                        name="pickup_address_id"
                                        value={
                                            formData.pickup_address_id
                                        }
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Select pickup address
                                        </option>

                                        {addresses.map((address) => (
                                            <option
                                                key={address.id}
                                                value={address.id}
                                            >
                                                {address.address_line}
                                                {" — "}
                                                {address.area_name}
                                                {address.is_default
                                                    ? " (Default)"
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Delivery Address
                                    </label>

                                    <select
                                        name="delivery_address_id"
                                        value={
                                            formData.delivery_address_id
                                        }
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Select delivery address
                                        </option>

                                        {addresses.map((address) => (
                                            <option
                                                key={address.id}
                                                value={address.id}
                                            >
                                                {address.address_line}
                                                {" — "}
                                                {address.area_name}
                                            </option>
                                        ))}
                                    </select>

                                </div>

                            </div>

                            <Link
                                to="/customer/addresses"
                                className="secondary-link"
                            >
                                + Manage addresses
                            </Link>

                        </section>

                        {/* PACKAGE */}

                        <section className="form-section">

                            <div className="section-title">
                                <span>02</span>
                                <div>
                                    <h2>Package Details</h2>
                                    <p>
                                        Provide the package dimensions
                                        and actual weight.
                                    </p>
                                </div>
                            </div>

                            <div className="form-grid four-columns">

                                <div className="form-group">
                                    <label>
                                        Length (cm)
                                    </label>

                                    <input
                                        type="number"
                                        name="length_cm"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            formData.length_cm
                                        }
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Width (cm)
                                    </label>

                                    <input
                                        type="number"
                                        name="width_cm"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            formData.width_cm
                                        }
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Height (cm)
                                    </label>

                                    <input
                                        type="number"
                                        name="height_cm"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            formData.height_cm
                                        }
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Weight (kg)
                                    </label>

                                    <input
                                        type="number"
                                        name="actual_weight_kg"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            formData.actual_weight_kg
                                        }
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                            </div>

                        </section>

                        {/* ORDER TYPE */}

                        <section className="form-section">

                            <div className="section-title">
                                <span>03</span>
                                <div>
                                    <h2>Order & Payment</h2>
                                    <p>
                                        Select the order and payment
                                        type.
                                    </p>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>
                                        Payment Type
                                    </label>

                                    <select
                                        name="payment_type"
                                        value={
                                            formData.payment_type
                                        }
                                        onChange={handleChange}
                                    >
                                        <option value="PREPAID">
                                            Prepaid
                                        </option>

                                        <option value="COD">
                                            Cash on Delivery
                                        </option>
                                    </select>
                                </div>

                            </div>

                        </section>

                        {/* ITEMS */}

                        <section className="form-section">

                            <div className="section-title">
                                <span>04</span>
                                <div>
                                    <h2>Order Items</h2>
                                    <p>
                                        Add the products included
                                        in the shipment.
                                    </p>
                                </div>
                            </div>

                            <div className="items-list">

                                {items.map((item, index) => (

                                    <div
                                        className="item-row"
                                        key={index}
                                    >

                                        <div className="form-group">
                                            <label>
                                                Product Name
                                            </label>

                                            <input
                                                type="text"
                                                name="product_name"
                                                value={
                                                    item.product_name
                                                }
                                                onChange={(event) =>
                                                    handleItemChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                                placeholder="e.g. Wireless Mouse"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>
                                                Quantity
                                            </label>

                                            <input
                                                type="number"
                                                name="quantity"
                                                min="1"
                                                value={
                                                    item.quantity
                                                }
                                                onChange={(event) =>
                                                    handleItemChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>
                                                Unit Price (₹)
                                            </label>

                                            <input
                                                type="number"
                                                name="unit_price"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    item.unit_price
                                                }
                                                onChange={(event) =>
                                                    handleItemChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                className="remove-item"
                                                onClick={() =>
                                                    removeItem(index)
                                                }
                                            >
                                                Remove
                                            </button>
                                        )}

                                    </div>

                                ))}

                            </div>

                            <button
                                type="button"
                                className="add-item-button"
                                onClick={addItem}
                            >
                                + Add another item
                            </button>

                        </section>

                        {error && (
                            <div className="order-message error">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="order-message success">
                                {success}
                            </div>
                        )}

                        {pricing && (
                            <div className="pricing-preview">

                                <h3>Order Created</h3>

                                <div className="pricing-row">
                                    <span>Chargeable Weight</span>
                                    <strong>
                                        {pricing.chargeableWeightKg} kg
                                    </strong>
                                </div>

                                <div className="pricing-row">
                                    <span>Delivery Charge</span>
                                    <strong>
                                        ₹{pricing.deliveryCharge}
                                    </strong>
                                </div>

                                <div className="pricing-row">
                                    <span>COD Surcharge</span>
                                    <strong>
                                        ₹{pricing.codSurcharge}
                                    </strong>
                                </div>

                                <div className="pricing-total">
                                    <span>Total Delivery Charge</span>
                                    <strong>
                                        ₹{pricing.totalCharge}
                                    </strong>
                                </div>

                            </div>
                        )}

                        <div className="form-actions">

                            <Link
                                to="/customer/dashboard"
                                className="cancel-button"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                className="submit-order-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating Order..."
                                    : "Place Order"}
                            </button>

                        </div>

                    </form>
                )}

            </main>

        </div>
    );
}

export default CreateOrder;