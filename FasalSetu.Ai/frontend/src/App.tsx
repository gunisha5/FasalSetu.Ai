import { Routes, Route } from 'react-router-dom';

import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Login from './pages/auth/Login';
import OtpVerify from './pages/auth/OtpVerify';
import RegistrationWizard from './pages/auth/RegistrationWizard';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

import FarmerLayout from './layouts/FarmerLayout';
import Dashboard from './pages/farmer/Dashboard';
import FarmList from './pages/farmer/FarmList';
import FarmDetail from './pages/farmer/FarmDetail';
import AddFarm from './pages/farmer/AddFarm';
import EditFarm from './pages/farmer/EditFarm';
import BankDetails from './pages/farmer/BankDetails';
import ClaimList from './pages/farmer/claims/ClaimList';
import ClaimFilingWizard from './pages/farmer/claims/ClaimFilingWizard';
import ClaimDetail from './pages/farmer/claims/ClaimDetail';
import Profile from './pages/farmer/Profile';

import AgentLayout from './layouts/AgentLayout';
import AgentDashboard from './pages/agent/AgentDashboard';
import ClaimQueue from './pages/agent/ClaimQueue';
import ClaimReview from './pages/agent/ClaimReview';
import MapOverview from './pages/agent/MapOverview';

import ProtectedRoute from './components/ProtectedRoute';
import OfflineBanner from './components/OfflineBanner';
import LoadingOverlay from './components/LoadingOverlay';

function App() {
  return (
    <div className="min-h-screen bg-surface-dark flex flex-col">
      {/* Global items */}
      <OfflineBanner />
      <LoadingOverlay />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<OtpVerify />} />
        <Route path="/register" element={<RegistrationWizard />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Farmer Routes */}
        <Route element={<ProtectedRoute allowedRole="FARMER" />}>
          <Route path="/farmer" element={<FarmerLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="farms" element={<FarmList />} />
            <Route path="farms/new" element={<AddFarm />} />
            <Route path="farms/:id" element={<FarmDetail />} />
            <Route path="farms/:id/edit" element={<EditFarm />} />
            <Route path="bank-details" element={<BankDetails />} />
            <Route path="claims" element={<ClaimList />} />
            <Route path="claims/new" element={<ClaimFilingWizard />} />
            <Route path="claims/:id" element={<ClaimDetail />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Protected Agent Routes */}
        <Route element={<ProtectedRoute allowedRole="AGENT" />}>
          <Route path="/agent" element={<AgentLayout />}>
            <Route path="farmers" element={<AgentDashboard />} />
            <Route path="claims" element={<ClaimQueue />} />
            <Route path="claims/:id" element={<ClaimReview />} />
          </Route>
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
