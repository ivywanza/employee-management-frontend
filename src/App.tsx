import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Leave from "./pages/Leave";
import ReviewLeave from "./pages/ReviewLeave";
import MySubmissions from "./pages/MySubmissions";
import DocumentHub from "./pages/DocumentHub";
import ManageDocuments from "./pages/ManageDocuments";
import ReviewOnboarding from "./pages/ReviewOnboarding";
import EmployeeList from "./pages/EmployeeList";
import OnboardingDocs from "./pages/OnboardingDocuments";
import ForgotPassword from "./pages/ForgotPassword";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />

            <Route path="/leave" element={<Leave />} />
            <Route path="/onboarding" element={<OnboardingDocs />} />
            <Route path="/documents" element={<DocumentHub />} />
            <Route path="/my-submissions" element={<MySubmissions />} />
            <Route path="/review-leave" element={<ReviewLeave />} />
            <Route path="/manage-documents" element={<ManageDocuments />} />
            <Route path="/review-onboarding" element={<ReviewOnboarding />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route
              path="/add-employee"
              element={
                <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                  <Register />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
