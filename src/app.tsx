import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/authcontext';
import { ToastProvider } from '@/contexts/ToastContext';
import DataPreloader from '@/components/DataPreloader';
import ReminderService from '@/components/ReminderService';
import Home from '@/pages/Home';
import Oficinas from '@/pages/Oficinas';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ResetPassword from '@/pages/ResetPassword';

// AuthCallback removido - não precisamos mais de confirmação de email

import AdminDashboard from '@/pages/admindashboard';
import WorkshopForm from '@/pages/WorkshopForm';
import AccountSettings from '@/pages/AccountSettings';
import AdminRoute from '@/components/AdminRoute';
import ProtectedRoute from '@/components/ProtectedRoute';


function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <DataPreloader />
        <ReminderService />
        <Router>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/oficinas" element={<Oficinas />} />
            <Route path="/login" element={<ProtectedRoute requireAuth={false}><Login /></ProtectedRoute>} />
            <Route path="/register" element={<ProtectedRoute requireAuth={false}><Register /></ProtectedRoute>} />
            <Route path="/reset-password" element={<ProtectedRoute requireAuth={false}><ResetPassword /></ProtectedRoute>} />
    
            {/* AuthCallback removido - não precisamos mais de confirmação de email */}
            <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
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
