import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Home from '@/pages/Home';
import Oficinas from '@/pages/Oficinas';
import Inscricao from '@/pages/Inscricao';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ResetPassword from '@/pages/ResetPassword';
import ConfirmEmail from '@/pages/ConfirmEmail';
import AuthCallback from '@/pages/AuthCallback';

import AdminDashboard from '@/pages/AdminDashboard';
import WorkshopForm from '@/pages/WorkshopForm';
import AccountSettings from '@/pages/AccountSettings';
import AdminRoute from '@/components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/oficinas" element={<Oficinas />} />
            <Route path="/inscricao" element={<Inscricao />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/workshop/new" element={<AdminRoute><WorkshopForm /></AdminRoute>} />
            <Route path="/admin/workshop/edit/:id" element={<AdminRoute><WorkshopForm /></AdminRoute>} />
          </Routes>
        </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
