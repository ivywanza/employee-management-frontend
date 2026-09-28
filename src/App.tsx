import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import ComingSoon from "./pages/ComingSoon";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/leave" element={<ComingSoon title="Apply for Leave" />} />
            <Route path="/onboarding" element={<ComingSoon title="Onboarding Documents" />} />
            <Route path="/documents" element={<ComingSoon title="Document Hub" />} />
            <Route path="/my-submissions" element={<ComingSoon title="My Submissions" />} />
            <Route path="/employees" element={<ComingSoon title="Employee List" />} />
            <Route path="/manage-documents" element={<ComingSoon title="Manage Documents" />} />
            <Route path="/review-leave" element={<ComingSoon title="Review Leave Requests" />} />
            <Route path="/review-onboarding" element={<ComingSoon title="Review Onboarding Documents" />} />
          </Route>

          <Route
            path="/add-employee"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <Register />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}