import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "./components/layout/Layout";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

import NotificationSettings from "./pages/NotificationSettings";
import NotificationTemplates from "./pages/NotificationTemplates";
import NotificationLogs from "./pages/NotificationLogs";


function App() {
  return (
    <Routes>

      {/* =====================================================
          LOGIN
      ===================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* =====================================================
          APPLICATION
      ===================================================== */}

      <Route element={<Layout />}>

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/settings"
          element={<NotificationSettings />}
        />

        <Route
          path="/templates"
          element={<NotificationTemplates />}
        />

        <Route
          path="/logs"
          element={<NotificationLogs />}
        />

      </Route>


      {/* =====================================================
          DEFAULT
          Open application at / → LOGIN
      ===================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />


      {/* =====================================================
          UNKNOWN ROUTE
          Unknown URLs → LOGIN
      ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;