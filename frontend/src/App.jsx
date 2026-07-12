import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PartyPage from "./pages/PartyPage";
import FirmPage from "./pages/FirmPage";
import DesignPage from "./pages/design/DesignPage";
import StockPage from "./pages/StockPage";
import ChallanPage from "./pages/ChallanPage";
import BillingPage from "./pages/BillingPage";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" reverseOrder={false} />
      <PwaInstallPrompt />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/party" element={<PartyPage />} />
        <Route path="/firm" element={<FirmPage />} />
        <Route path="/design" element={<DesignPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/challan" element={<ChallanPage />} />
        <Route path="/billing" element={<BillingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
