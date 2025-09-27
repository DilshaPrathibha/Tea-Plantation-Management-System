import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import {
  Leaf,
  LogOut,
  LogIn,
  Home,
  User2,
  BarChart2,
  Wrench,
  FlaskConical,
  Menu,
  X,
  Users,
  MapPin,
  Mail,
  Calendar,
  Shield,
  FileText,
  Package,
  Truck,
  User
} from 'lucide-react';
import { Sweet } from '../utils/sweet';

/* Route to send user after login based on role */
const roleHome = (role) => {
  switch (role) {
    case 'admin': return '/admin';
    case 'field_supervisor': return '/supervisor';
    case 'production_manager': return '/production-dashboard';
    case 'inventory_manager': return '/inventory';
    case 'worker': return '/worker';
    default: return '/';
  }
};

/* Read auth state from localStorage safely */
const readAuth = () => {
  const token = localStorage.getItem('token');
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
  const authed = Boolean(token && user && user.role);
  return { authed, token, user };
};

/* Convert role to readable position title */
const getRoleTitle = (role) => {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'field_supervisor': return 'Field Supervisor';
    case 'production_manager': return 'Production Manager';
    case 'inventory_manager': return 'Inventory Manager';
    case 'worker': return 'Worker';
    default: return 'Team Member';
  }
};

/* Get role-specific navigation links */
const getRoleNavLinks = (role) => {
  switch (role) {
    case 'admin':
      return [
        { label: 'Dashboard', href: '/admin', icon: Home, exact: true },
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Fields', href: '/admin/fields', icon: MapPin },
        { label: 'Notifications', href: '/admin/notifications', icon: Mail },
      ];
    
    case 'field_supervisor':
      return [
        { label: 'Dashboard', href: '/supervisor', icon: Home, exact: true },
        { label: 'Attendance', href: '/supervisor/attendance', icon: Calendar },
        { label: 'Tasks', href: '/supervisor/tasks', icon: Users },
        { label: 'Pest & Disease', href: '/supervisor/pestdisease', icon: Shield },
        { label: 'Reports', href: '/reports', icon: FileText },
      ];
    
    case 'production_manager':
      return [
        { label: 'Dashboard', href: '/production-dashboard', icon: Home, exact: true },
        { label: 'Batches', href: '/production-batches', icon: Package },
        { label: 'Tracking', href: '/vehicle-tracking', icon: Truck },
        { label: 'Transport', href: '/transports', icon: Truck },
        { label: 'Reports', href: '/reports', icon: FileText },
      ];
    
    case 'inventory_manager':
      return [
        { label: 'Dashboard', href: '/inventory', icon: Home, exact: true },
        { label: 'Tools', href: '/inventory/tools', icon: Wrench },
        { label: 'FNI', href: '/inventory/fni', icon: FlaskConical },
        { label: 'Reports', href: '/inventory/reports', icon: BarChart2 },
      ];
    
    case 'worker':
      return [
        { label: 'Dashboard', href: '/worker', icon: Home, exact: true },
        { label: 'Profile', href: '/profile', icon: User },
      ];
    
    default:
      return [];
  }
};

const initialsOf = (user) => {
  const name = user?.name || '';
  if (name.trim()) {
    const parts = name.trim().split(/\s+/);
    const firstInitial = parts[0]?.[0]?.toUpperCase() || '';
    const lastInitial = parts.length > 1 ? (parts[parts.length - 1]?.[0]?.toUpperCase() || '') : '';
    return firstInitial + lastInitial;
  }
  const mail = user?.email || '';
  if (mail) return mail[0]?.toUpperCase() || '';
  return 'U';
};

const Navbar = () => {
  const navigate = useNavigate();
  const [{ authed, user }, setAuth] = useState(readAuth());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Keep Navbar updated after login/logout and across tabs */
  useEffect(() => {
    const onAuth = () => setAuth(readAuth());
    window.addEventListener('auth-changed', onAuth);
    window.addEventListener('storage', onAuth);
    return () => {
      window.removeEventListener('auth-changed', onAuth);
      window.removeEventListener('storage', onAuth);
    };
  }, []);

  /* Close mobile menu when clicking outside or navigating */
  useEffect(() => {
    const handleOutsideInteraction = (event) => {
      if (mobileMenuOpen && !event.target.closest('.mobile-menu-container') && !event.target.closest('.mobile-menu-dropdown')) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      // Use both click and touchstart for outside detection
      document.addEventListener('click', handleOutsideInteraction);
      document.addEventListener('touchstart', handleOutsideInteraction);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('click', handleOutsideInteraction);
        document.removeEventListener('touchstart', handleOutsideInteraction);
        document.body.style.overflow = '';
      };
    }
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Enhanced mobile menu toggle with proper mobile touch handling
  const toggleMobileMenu = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setMobileMenuOpen(prev => !prev);
  }, []);

  // Handle touch events specifically for mobile - prevent double triggering
  const handleMenuButtonTouch = useCallback((event) => {
    // Only handle touch on mobile devices
    if (event.type === 'touchstart') {
      event.preventDefault();
      event.stopPropagation();
      setMobileMenuOpen(prev => !prev);
    }
  }, []);

  // Handle click events for desktop/mouse users
  const handleMenuButtonClick = useCallback((event) => {
    // Prevent if touch was already handled
    if (event.type === 'click' && event.detail === 0) {
      // This was triggered by touch, ignore
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setMobileMenuOpen(prev => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    const confirmed = await Sweet.confirm('Are you sure you want to sign out?', 'Confirm Sign Out');
    if (!confirmed) return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-changed')); // notify listeners
    navigate('/login');
  }, [navigate]);

  return (
    <header className="sticky top-0 bg-base-300 border-b border-base-content/10 z-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between relative">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-emerald-500/20 blur-sm opacity-0 group-hover:opacity-100 transition" />
              <Leaf className="relative w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 group-hover:text-emerald-300 transition" />
            </div>
            <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-white">
              <span className="text-emerald-400">Ceylon</span>Leaf
            </span>
          </Link>

          {/* Desktop Navigation for All Authenticated Users */}
          {authed && user?.role && (
            <nav className="hidden md:flex gap-1">
              {getRoleNavLinks(user.role).map((link) => (
                <NavLink 
                  key={link.href}
                  to={link.href} 
                  end={link.exact}
                  className={({ isActive }) =>
                    `btn btn-ghost btn-sm flex items-center gap-1 ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-base-content/10'}`
                  }
                >
                  <link.icon size={18} />
                  <span className="hidden lg:inline">{link.label}</span>
                </NavLink>
              ))}
            </nav>
          )}

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Mobile menu button for authenticated users */}
            {authed && user?.role && (
              <div className="md:hidden mobile-menu-container">
                <button
                  onClick={handleMenuButtonClick}
                  onTouchStart={handleMenuButtonTouch}
                  className="btn btn-ghost btn-sm p-3 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation select-none relative"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                  aria-label="Toggle mobile menu"
                  aria-expanded={mobileMenuOpen}
                  type="button"
                >
                  <span className="transition-transform duration-200 ease-in-out">
                    {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                  </span>
                </button>
              </div>
            )}

            {!authed ? (
              <button
                className="inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500 text-white shadow-sm hover:shadow transition text-sm sm:text-base"
                onClick={() => navigate('/login')}
                aria-label="Login"
              >
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold">Login</span>
              </button>
            ) : (
              <div className="flex items-center">
                {/* User chip with responsive styling */}
                <div className="dropdown dropdown-end dropdown-hover" style={{ position: 'relative' }}>
                  <div tabIndex={0} role="button" className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-2 sm:px-3 py-1.5 hover:bg-white/10 transition cursor-pointer">
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 grid place-items-center text-white font-bold">
                      <span className="text-xs sm:text-sm leading-none">{initialsOf(user)}</span>
                      <div className="absolute -inset-0.5 rounded-full ring-1 ring-white/10"></div>
                    </div>
                    <div className="hidden sm:flex flex-col leading-tight">
                      <span className="text-white text-sm font-semibold">
                        {user?.name || user?.email || 'User'}
                      </span>
                      <span className="text-xs text-white/70 sm:truncate max-w-[180px]">
                        {getRoleTitle(user?.role)}
                      </span>
                    </div>
                  </div>
                  {/* Dropdown menu for actions */}
                  <ul 
                    tabIndex={0} 
                    className="dropdown-content menu bg-base-300 rounded-box z-[9999] w-52 p-2 shadow-xl border border-base-content/10"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 0
                    }}
                  >
                    <li className="menu-title">
                      <span className="text-xs">Account Info</span>
                    </li>
                    <li>
                      <div className="flex flex-col items-start p-2 cursor-default hover:bg-transparent">
                        <span className="font-semibold text-sm">{user?.name || 'User'}</span>
                        <span className="text-xs opacity-70">{user?.email || 'No email'}</span>
                        <span className="text-xs text-primary mt-1 uppercase tracking-wide">
                          {getRoleTitle(user?.role)}
                        </span>
                      </div>
                    </li>
                    <div className="divider my-1"></div>
                    {/* Dashboard shortcut in dropdown - always show for authenticated users */}
                    {user?.role && (
                      <li>
                        <button
                          onClick={() => {
                            navigate(roleHome(user?.role));
                            document.activeElement?.blur();
                          }}
                          className="flex items-center gap-2 w-full"
                        >
                          <Home className="w-4 h-4" />
                          Dashboard
                        </button>
                      </li>
                    )}
                    <li>
                      <button
                        onClick={() => {
                          handleLogout();
                          document.activeElement?.blur();
                        }}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Navigation Menu */}
          {authed && user?.role && mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-base-300 border-b border-base-content/10 shadow-lg mobile-menu-dropdown">
              <nav className="px-4 py-3 space-y-2">
                {getRoleNavLinks(user.role).map((link) => (
                  <div
                    key={link.href}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle touch navigation
                      closeMobileMenu();
                      setTimeout(() => navigate(link.href), 100);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle click navigation (desktop responsive mode)
                      closeMobileMenu();
                      setTimeout(() => navigate(link.href), 100);
                    }}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg transition mobile-menu-item cursor-pointer hover:bg-base-content/10 text-base-content active:bg-base-content/20"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                  >
                    <link.icon size={20} />
                    <span className="font-medium">{link.label}</span>
                  </div>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;