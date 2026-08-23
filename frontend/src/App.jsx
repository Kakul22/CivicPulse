import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import IssuesListPage from "./pages/IssuesListPage.jsx";
import ReportIssuePage from "./pages/ReportIssuePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Navbar />
        <Routes>
          <Route path="/" element={<IssuesListPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/report"
            element={
              <RequireAuth>
                <ReportIssuePage />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}
