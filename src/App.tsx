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
import SubmitGrievance from "./pages/grievances/SubmitGrievance";
import {
  GrievancesView,
  GrievancesManage,
} from "./pages/grievances/GrievanceBoard";
import RequisitionForm from "./pages/requisitions/RequisitionForm";
import RequisitionsAdmin from "./pages/requisitions/RequisitionsAdmin";
import Departments from "./pages/Departments";
import AssetsPage from "./pages/Assets";
import AcceptAssetAssignment from "./pages/AcceptAssetAssignment";
import AssetOperations from "./pages/AssetOperations";

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
                <Route
                  path="/assets/accept-assignment"
                  element={
                    <ProtectedRoute
                      allowedRoles={["employee", "admin", "superadmin"]}
                    >
                      <AcceptAssetAssignment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assets/operations"
                  element={
                    <ProtectedRoute
                      allowedRoles={["employee", "admin", "superadmin"]}
                    >
                      <AssetOperations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/review-onboarding"
                  element={<ReviewOnboarding />}
                />
                <Route path="/associates" element={<EmployeeList />} />
                <Route
                  path="/grievances/submit"
                  element={<SubmitGrievance />}
                />
                <Route path="/grievances/view" element={<GrievancesView />} />{" "}
                <Route
                  path="/departments"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                      <Departments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/departments/manage"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <Departments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assets"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                      <AssetsPage mode="view" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assets/mine"
                  element={
                    <ProtectedRoute
                      allowedRoles={["employee", "admin", "superadmin"]}
                    >
                      <AssetsPage mode="mine" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assets/requests"
                  element={
                    <ProtectedRoute
                      allowedRoles={["employee", "admin", "superadmin"]}
                    >
                      <AssetsPage mode="request" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assets/manage"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <AssetsPage mode="manage" />
                    </ProtectedRoute>
                  }
                />
                {/* managers only */}
                <Route
                  path="/grievances/submit"
                  element={<SubmitGrievance />}
                />
                <Route
                  path="/grievances/inbox"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <GrievancesView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/grievances/view"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <GrievancesView />
                    </ProtectedRoute>
                  }
                />
                <Route path="/requisitions/submit" element={<RequisitionForm />} />

<Route path="/requisitions/mine" element={<RequisitionForm />} />

<Route
  path="/requisitions"
  element={
    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
      <RequisitionsAdmin />
    </ProtectedRoute>
  }
/>

<Route
  path="/requisitions/review"
  element={
    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
      <RequisitionsAdmin />
    </ProtectedRoute>
  }
/>

<Route
  path="/requisitions/manage"
  element={
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <RequisitionsAdmin />
    </ProtectedRoute>
  }
/>

                {/* admin + superadmin */}
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
