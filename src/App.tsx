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
import OnboardingDocs from "./pages/OnboardingDocuments";

import EmployeeList from "./pages/EmployeeList";

import SubmitGrievance from "./pages/grievances/SubmitGrievance";
import { GrievancesView } from "./pages/grievances/GrievanceBoard";

import RequisitionForm from "./pages/requisitions/RequisitionForm";
import RequisitionsAdmin from "./pages/requisitions/RequisitionsAdmin";
import MyRequisitions from "./pages/requisitions/MyRequisitions";

import Departments from "./pages/Departments";

import AssetsPage from "./pages/Assets";
import AcceptAssetAssignment from "./pages/AcceptAssetAssignment";
import AssetOperations from "./pages/AssetOperations";

import MonthlySales from "./pages/MonthlySales";
import ReviewSales from "./pages/ReviewSales";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LiveProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Authenticated routes */}
            <Route
              element={
                <ProtectedRoute>
                  <OnboardingGate />
                </ProtectedRoute>
              }
            >
              {/* Account setup and welcome */}
              <Route path="/setup" element={<Setup />} />
              <Route path="/welcome" element={<Welcome />} />

              {/* Main dashboard */}
              <Route element={<DashboardLayout />}>
                <Route index element={<Home />} />

                {/* Leave management */}
                <Route path="leave" element={<Leave />} />
                <Route path="review-leave" element={<ReviewLeave />} />
                <Route path="my-submissions" element={<MySubmissions />} />

                {/* Onboarding */}
                <Route path="onboarding" element={<OnboardingDocs />} />
                <Route
                  path="review-onboarding"
                  element={<ReviewOnboarding />}
                />

                {/* Documents */}
                <Route path="documents" element={<DocumentHub />} />
                <Route path="manage-documents" element={<ManageDocuments />} />

                {/* Associates */}
                <Route path="associates" element={<EmployeeList />} />

                {/* Bella Organics monthly sales */}
                <Route path="monthly-sales" element={<MonthlySales />} />
                <Route
                  path="monthly-sales/review"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "hr", "superadmin"]}
                    >
                      <ReviewSales />
                    </ProtectedRoute>
                  }
                />

                {/* Grievances */}
                <Route path="grievances/submit" element={<SubmitGrievance />} />
                <Route
                  path="grievances/view"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <GrievancesView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="grievances/inbox"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <GrievancesView />
                    </ProtectedRoute>
                  }
                />

                {/* Departments */}
                <Route
                  path="departments"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                      <Departments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="departments/manage"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <Departments />
                    </ProtectedRoute>
                  }
                />

                {/* Assets */}
                <Route
                  path="assets"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                      <AssetsPage mode="view" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="assets/mine"
                  element={
                    <ProtectedRoute
                      allowedRoles={["employee", "admin", "superadmin"]}
                    >
                      <AssetsPage mode="mine" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="assets/requests"
                  element={
                    <ProtectedRoute
                      allowedRoles={["employee", "admin", "superadmin"]}
                    >
                      <AssetsPage mode="request" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="assets/manage"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <AssetsPage mode="manage" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="assets/accept-assignment"
                  element={
                    <ProtectedRoute
                      allowedRoles={["employee", "admin", "superadmin"]}
                    >
                      <AcceptAssetAssignment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="assets/operations"
                  element={
                    <ProtectedRoute
                      allowedRoles={["employee", "admin", "superadmin"]}
                    >
                      <AssetOperations />
                    </ProtectedRoute>
                  }
                />

                {/* Requisitions */}
                <Route
                  path="requisitions/submit"
                  element={<RequisitionForm />}
                />
                <Route path="requisitions/mine" element={<MyRequisitions />} />
                <Route
                  path="requisitions"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                      <RequisitionsAdmin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="requisitions/review"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                      <RequisitionsAdmin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="requisitions/manage"
                  element={
                    <ProtectedRoute allowedRoles={["superadmin"]}>
                      <RequisitionsAdmin />
                    </ProtectedRoute>
                  }
                />

                {/* Add associate */}
                <Route
                  path="add-associate"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "hr", "superadmin"]}
                    >
                      <Register />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Route>

            {/* Unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LiveProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
