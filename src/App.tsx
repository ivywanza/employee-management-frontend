import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LiveProvider } from "./context/LiveProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import OnboardingGate from "./components/OnboardingGate";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Setup from "./pages/Setup";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Leave from "./pages/Leave";
import ReviewLeave from "./pages/ReviewLeave";
import MySubmissions from "./pages/MySubmissions";
import DocumentHub from "./pages/DocumentHub";
import ManageDocuments from "./pages/ManageDocuments";
import ReviewOnboarding from "./pages/ReviewOnboarding";
import EmployeeList from "./pages/EmployeeList";
import Messages from "./pages/Message";
import OnboardingDocs from "./pages/OnboardingDocuments";


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LiveProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route
              element={
                <ProtectedRoute>
                  <OnboardingGate />
                </ProtectedRoute>
              }
            >
              <Route path="/setup" element={<Setup />} />
              <Route path="/welcome" element={<Welcome />} />

              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/leave" element={<Leave />} />
                <Route path="/onboarding" element={<OnboardingDocs />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/documents" element={<DocumentHub />} />
                <Route path="/my-submissions" element={<MySubmissions />} />
                <Route path="/review-leave" element={<ReviewLeave />} />
                <Route path="/manage-documents" element={<ManageDocuments />} />
                <Route path="/review-onboarding" element={<ReviewOnboarding />} />
                <Route path="/associates" element={<EmployeeList />} />
                <Route
                  path="/add-associate"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                      <Register />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LiveProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}