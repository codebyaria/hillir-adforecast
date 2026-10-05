import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "./auth/AuthRoutes";
import { ProtectedShell } from "./components/ProtectedShell";
import { CalculatorPage } from "./pages/CalculatorPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route element={<ProtectedRoute><ProtectedShell /></ProtectedRoute>}>
          <Route index element={<CalculatorPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
