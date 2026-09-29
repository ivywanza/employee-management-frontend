import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import ComingSoon from "./pages/ComingSoon";
import Leave from "./pages/Leave";
import ReviewLeave from "./pages/ReviewLeave";
import MySubmissions from "./pages/MySubmissions";
import DocumentHub from "./pages/DocumentHub";


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
            <Route path="/leave" element={<Leave />} />
            <Route path="/documents" element={<DocumentHub />} />
            <Route path="/my-submissions" element={<MySubmissions />} />
            <Route path="/review-leave" element={<ReviewLeave />} />

            <Route
              path="/employees"
              element={<ComingSoon title="Employee List" />}
            />
            <Route
              path="/manage-documents"
              element={<ComingSoon title="Manage Documents" />}
            />
            <Route
              path="/review-leave"
              element={<ComingSoon title="Review Leave Requests" />}
            />
            <Route
              path="/review-onboarding"
              element={<ComingSoon title="Review Onboarding Documents" />}
            />
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
