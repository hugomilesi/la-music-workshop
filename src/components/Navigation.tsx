import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Music, Home, Calendar, UserPlus, LogIn, LogOut, Settings, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/oficinas', label: 'Oficinas', icon: Calendar },
    { path: '/inscricao', label: 'Inscrição', icon: UserPlus },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="w-full px-4">
        <div className="flex items-center h-20">
          {/* Logo - Fixed to the left corner */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-3 text-white hover:text-purple-200 transition-colors">
              <img 
                src="/assets/lamusic.png" 
                alt="LA Music Week" 
                className="w-24 h-24 object-contain"
              />
              <span className="text-2xl font-bold font-inter">LA Music Week</span>
            </Link>
          </div>

          {/* Spacer to push navigation to the right */}
          <div className="flex-grow"></div>

          {/* Desktop Navigation - Fixed to the right corner */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 xl:space-x-6 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 text-base ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white glow'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Unified Login/Cadastro Button */}
            <LoginButton />
          </div>

          {/* Mobile Menu Button - Fixed to the right corner */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg glass text-white hover:bg-white/20 transition-colors flex-shrink-0"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/20 animate-slideDown">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              <MobileLoginButton onClose={() => setIsOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Componente unificado de login para desktop
function LoginButton() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (user) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => navigate('/account-settings')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
            location.pathname === '/account-settings'
              ? 'bg-white/20 text-white glow'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="font-medium">Conta</span>
        </button>
        {(profile?.user_type === 'admin' || user?.email === 'admin@lamusicweek.com') && (
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-secondary text-white hover:shadow-lg hover:shadow-pink-500/25 focus:ring-pink-500 glow-pink transition-all duration-300"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Dashboard</span>
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 rounded-full glass border border-white/20 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate('/login')}
      className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-primary text-white hover:shadow-glow-purple transition-all duration-300"
    >
      <LogIn className="w-4 h-4" />
      <span className="font-medium">Login/Cadastro</span>
    </button>
  );
}



// Componente unificado de login para mobile
function MobileLoginButton({ onClose }: { onClose: () => void }) {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose();
    await signOut();
    navigate('/');
  };

  if (user) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => {
            onClose();
            navigate('/account-settings');
          }}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-primary text-white hover:shadow-glow-purple transition-all duration-300 w-full text-left animate-fadeIn"
        >
          <User className="w-5 h-5" />
          <span className="font-medium">Configurações da Conta</span>
        </button>
        {(profile?.user_type === 'admin' || user?.email === 'admin@lamusicweek.com') && (
          <button
            onClick={() => {
              onClose();
              navigate('/admin/dashboard');
            }}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-secondary text-white hover:shadow-lg hover:shadow-pink-500/25 focus:ring-pink-500 glow-pink transition-all duration-300 w-full text-left animate-fadeIn"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg glass border border-white/20 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 w-full text-left animate-fadeIn"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        onClose();
        navigate('/login');
      }}
      className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-primary text-white hover:shadow-glow-purple transition-all duration-300 w-full text-left animate-fadeIn"
    >
      <LogIn className="w-5 h-5" />
      <span className="font-medium">Login/Cadastro</span>
    </button>
  );
}