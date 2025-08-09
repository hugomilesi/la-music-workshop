import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Music, Home, Calendar, UserPlus, LogIn, LogOut, Settings, User, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const navItems = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/oficinas', label: 'Oficinas', icon: Calendar },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass notch-safe-top">
      <div className="w-full px-4">
        <div className="flex items-center h-20 notch-safe">
          {/* Logo - Fixed to the left corner */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-3 text-white hover:text-purple-200 transition-colors">
              <img 
                src="/assets/Logo Kids e LA.png" 
                alt="LA Music Week" 
                className="w-16 h-6 md:w-20 md:h-8 object-contain"
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
            className="md:hidden p-2 rounded-lg glass text-white hover:bg-white/20 transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center touch-target btn-mobile-optimized"
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden fixed inset-x-0 top-20 z-40 animate-fadeIn">
            {/* Modern Backdrop */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-indigo-900/40 backdrop-blur-lg"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar menu"
            />
            
            {/* Compact Menu Container */}
            <div className="relative mx-4 mt-4 animate-slideDown">
              <div className="bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden max-h-[70vh] overflow-y-auto">
                {/* Simple Header */}
                 <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-indigo-500/10" />
                 
                 {/* User Greeting Section - First */}
                 {user && (
                   <div className="relative z-10 px-3 pt-4 pb-2">
                     <div className="relative p-3 bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/50 overflow-hidden min-h-[56px] flex items-center">
                       <div className="flex items-center space-x-3 w-full">
                         <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                           <User className="w-4 h-4 text-white" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-semibold text-gray-800 truncate">
                             Olá, {profile?.nome_completo ? profile.nome_completo.split(' ')[0] : user?.email ? user.email.split('@')[0] : 'Usuário'}!
                           </p>
                           {profile?.user_type === 'admin' && (
                             <span className="text-xs text-purple-600 font-medium">Admin</span>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 {/* Compact Navigation Items */}
                 <div className="relative z-10 px-3 py-4 space-y-2">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`group relative flex items-center p-3 rounded-xl transition-all duration-500 ease-out overflow-hidden min-h-[56px] ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white shadow-2xl transform scale-[1.02]'
                            : 'bg-white/60 text-gray-800 hover:bg-gradient-to-r hover:from-purple-400/80 hover:to-pink-400/80 hover:text-white hover:shadow-xl hover:transform hover:scale-[1.02] border border-gray-200/50'
                        }`}
                        style={{ 
                          animationDelay: `${index * 150}ms`,
                          animation: `slideInFromLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 150}ms both`
                        }}
                        aria-label={`Navegar para ${item.label}`}
                      >
                        {/* Background Gradient Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-r transition-opacity duration-700 ${
                          isActive(item.path) 
                            ? 'from-purple-600/20 to-pink-600/20 opacity-100' 
                            : 'from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100'
                        }`} />
                        
                        {/* Icon Container */}
                        <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 flex-shrink-0 ${
                          isActive(item.path)
                            ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                            : 'bg-gray-100/80 text-gray-600 group-hover:bg-white/30 group-hover:text-white group-hover:shadow-lg group-hover:backdrop-blur-sm'
                        }`}>
                          <Icon className="w-4 h-4 transition-all duration-300" />
                        </div>
                        
                        {/* Content */}
                        <div className="relative z-10 flex-1 ml-3 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`font-semibold text-sm transition-all duration-300 truncate ${
                              isActive(item.path) ? 'text-white' : 'text-gray-800 group-hover:text-white'
                            }`}>
                              {item.label}
                            </span>
                            {isActive(item.path) && (
                              <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" />
                                <span className="text-xs text-white/80 font-medium">Atual</span>
                              </div>
                            )}
                          </div>
                          {isActive(item.path) && (
                            <div className="mt-1 h-0.5 bg-gradient-to-r from-white/60 to-transparent rounded-full animate-pulse" />
                          )}
                        </div>
                        
                        {/* Arrow Indicator */}
                        <div className={`relative z-10 transition-all duration-500 flex-shrink-0 ${
                          isActive(item.path) ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                        }`}>
                          <ChevronDown className="w-4 h-4 transform rotate-[-90deg]" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
                
                {/* Simple Divider */}
                <div className="mx-4 my-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />
                </div>
                
                {/* Compact Login Section */}
                <div className="px-3 pb-4">
                  <MobileLoginButton onClose={() => setIsOpen(false)} />
                </div>
              </div>
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut();
    navigate('/login');
  };

  const getFirstName = () => {
    if (profile?.nome_completo) {
      return profile.nome_completo.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuário';
  };

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-4 py-2 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 touch-target"
        >
          <User className="w-4 h-4" />
          <span className="font-medium">{getFirstName()}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isDropdownOpen && (
           <div className="absolute right-0 mt-2 w-64 glass-dropdown border border-white/20 rounded-xl shadow-2xl py-1 z-50 animate-slideDown">
             <div className="px-4 py-3 border-b border-white/20 bg-white/5">
               <p className="text-sm font-bold text-white drop-shadow-lg truncate">
                 {profile?.nome_completo || user.email}
               </p>
               {profile?.user_type === 'admin' && (
                 <div className="flex items-center space-x-2 mt-1">
                   <Shield className="w-3 h-3 text-purple-200" />
                   <span className="text-xs text-purple-200 font-medium">Administrador</span>
                 </div>
               )}
             </div>
             
             <div className="py-2">
               <button
                 onClick={() => {
                   setIsDropdownOpen(false);
                   navigate('/account-settings');
                 }}
                 className="flex items-center space-x-3 w-full px-4 py-3 text-left text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 group rounded-lg mx-1 font-medium"
               >
                 <div className="p-2 rounded-lg bg-white/10 group-hover:bg-purple-500/20 transition-all duration-300 flex-shrink-0">
                   <User className="w-4 h-4 group-hover:text-purple-200 transition-colors" />
                 </div>
                 <span className="group-hover:text-purple-200 transition-colors text-sm">Configurações da Conta</span>
               </button>
               
               {(profile?.user_type === 'admin' || user?.email === 'admin@lamusicweek.com') && (
                 <button
                   onClick={() => {
                     setIsDropdownOpen(false);
                     navigate('/admin/dashboard');
                   }}
                   className="flex items-center space-x-3 w-full px-4 py-3 text-left text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 group rounded-lg mx-1 font-medium mt-1"
                 >
                   <div className="p-2 rounded-lg bg-white/10 group-hover:bg-pink-500/20 transition-all duration-300 flex-shrink-0">
                     <Settings className="w-4 h-4 group-hover:text-pink-200 transition-colors" />
                   </div>
                   <span className="group-hover:text-pink-200 transition-colors text-sm">Dashboard Admin</span>
                 </button>
               )}
             </div>
             
             <div className="border-t border-white/20 pt-2 mt-1">
               <button
                 onClick={handleLogout}
                 className="flex items-center space-x-3 w-full px-4 py-3 text-left text-red-300 hover:text-red-100 hover:bg-red-500/15 transition-all duration-300 group rounded-lg mx-1 font-medium"
               >
                 <div className="p-2 rounded-lg bg-white/10 group-hover:bg-red-500/20 transition-all duration-300 flex-shrink-0">
                   <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform" />
                 </div>
                 <span className="group-hover:text-red-100 transition-all text-sm">Logout</span>
               </button>
             </div>
           </div>
         )}
        
        {/* Overlay to close dropdown when clicking outside */}
        {isDropdownOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate('/login')}
      className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-primary text-white hover:shadow-glow-purple transition-all duration-300 touch-target btn-mobile-optimized"
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
    navigate('/login');
  };

  const getFirstName = () => {
    if (profile?.nome_completo) {
      return profile.nome_completo.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuário';
  };

  if (user) {
    return (
      <div className="space-y-2">
        {/* Compact Menu Items */}
        <button
          onClick={() => {
            onClose();
            navigate('/account-settings');
          }}
          className="group relative flex items-center p-3 w-full rounded-xl transition-all duration-300 ease-out overflow-hidden min-h-[56px] bg-white/60 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-400/80 hover:to-purple-400/80 hover:text-white hover:shadow-lg border border-gray-200/50"
          aria-label="Ir para configurações da conta"
        >
          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100/80 text-gray-600 group-hover:bg-white/30 group-hover:text-white transition-all duration-300 flex-shrink-0">
            <Settings className="w-4 h-4 transition-all duration-300" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex-1 ml-3 min-w-0">
            <span className="font-semibold text-sm text-gray-800 group-hover:text-white transition-all duration-300 truncate">
              Configurações
            </span>
          </div>
        </button>
        
        {(profile?.user_type === 'admin' || user?.email === 'admin@lamusicweek.com') && (
          <button
            onClick={() => {
              onClose();
              navigate('/admin/dashboard');
            }}
            className="group relative flex items-center p-3 w-full rounded-xl transition-all duration-300 ease-out overflow-hidden min-h-[56px] bg-white/60 text-gray-800 hover:bg-gradient-to-r hover:from-pink-400/80 hover:to-purple-400/80 hover:text-white hover:shadow-lg border border-gray-200/50"
            aria-label="Ir para dashboard administrativo"
          >
            {/* Icon */}
            <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100/80 text-gray-600 group-hover:bg-white/30 group-hover:text-white transition-all duration-300 flex-shrink-0">
              <Shield className="w-4 h-4 transition-all duration-300" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex-1 ml-3 min-w-0">
              <span className="font-semibold text-sm text-gray-800 group-hover:text-white transition-all duration-300 truncate">
                Dashboard Admin
              </span>
            </div>
          </button>
        )}
        
        <button
          onClick={handleLogout}
          className="group relative flex items-center p-3 w-full rounded-xl transition-all duration-300 ease-out overflow-hidden min-h-[56px] bg-white/60 text-gray-800 hover:bg-gradient-to-r hover:from-red-400/80 hover:to-red-500/80 hover:text-white hover:shadow-lg border border-gray-200/50"
          aria-label="Fazer logout da conta"
        >
          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100/80 text-gray-600 group-hover:bg-white/30 group-hover:text-white transition-all duration-300 flex-shrink-0">
            <LogOut className="w-4 h-4 transition-all duration-300" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex-1 ml-3 min-w-0">
            <span className="font-semibold text-sm text-gray-800 group-hover:text-white transition-all duration-300 truncate">
              Logout
            </span>
          </div>
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
      className="group relative flex items-center p-3 w-full rounded-xl transition-all duration-300 ease-out overflow-hidden min-h-[56px] bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white shadow-xl hover:shadow-2xl border border-purple-300/50"
      aria-label="Ir para página de login ou cadastro"
    >
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-100" />
      
      {/* Icon */}
      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 text-white shadow-lg backdrop-blur-sm transition-all duration-300 flex-shrink-0">
        <LogIn className="w-4 h-4" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex-1 ml-3 min-w-0">
        <span className="font-semibold text-sm text-white truncate">
          Login/Cadastro
        </span>
      </div>
      
      {/* Arrow */}
      <div className="relative z-10 opacity-100 transform translate-x-0 transition-all duration-300 flex-shrink-0">
        <ChevronDown className="w-4 h-4 transform rotate-[-90deg]" />
      </div>
    </button>
  );
}