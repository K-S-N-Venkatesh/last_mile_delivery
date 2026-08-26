import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CustomerRegister from "./pages/auth/CustomerRegister";
import CustomerLogin from "./pages/auth/CustomerLogin";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CreateOrder from "./pages/customer/CreateOrder";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<LandingPage />} />

                <Route
                    path="/customer/register"
                    element={<CustomerRegister />}
                />
                <Route
                    path="/customer/login"
                    element={<CustomerLogin />}
                />

                <Route
                    path="/customer/dashboard"
                    element={<CustomerDashboard />}
                />

                <Route
                    path="/customer/orders/create"
                    element={<CreateOrder />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;