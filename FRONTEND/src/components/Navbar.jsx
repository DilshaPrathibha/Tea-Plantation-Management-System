import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import {
  Leaf,
  LogOut,
  LogIn,
  Home,
  User2,
  Wrench,
  FlaskConical,
  Menu,
  X,
  Users,
  MapPin,
  Mail,
  Bell,
  Calendar,
  Shield,
  Package,
  AlertTriangle,
  Truck,
  User,
  Ticket,
  Sun,
  Moon
} from 'lucide-react';
import { Sweet } from '../utils/sweet';
import { useTheme } from '../context/ThemeContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) {
    console.warn('[readAuth] Failed to parse user from storage', e);
  }
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
        { label: 'Incidences', href: '/admin/incidences', icon: AlertTriangle },
        { label: 'Notifications', href: '/admin/notifications', icon: Mail },
        { label: 'Tickets', href: '/admin/tickets', icon: Ticket },
      ];
    
    case 'field_supervisor':
      return [
        { label: 'Dashboard', href: '/supervisor', icon: Home, exact: true },
        { label: 'Attendance', href: '/supervisor/attendance', icon: Calendar },
        { label: 'Tasks', href: '/supervisor/tasks', icon: Users },
        { label: 'Pest & Disease', href: '/supervisor/pest-disease', icon: Shield },
      ];
    
    case 'production_manager':
      return [
        { label: 'Dashboard', href: '/production-dashboard', icon: Home, exact: true },
        { label: 'Batches', href: '/production-batches', icon: Package },
        { label: 'Tracking', href: '/vehicle-tracking', icon: Truck },
        { label: 'Transport', href: '/transports', icon: Truck },
      ];
    
    case 'inventory_manager':
      return [
        { label: 'Dashboard', href: '/inventory', icon: Home, exact: true },
        { label: 'Tools', href: '/inventory/tools', icon: Wrench },
        { label: 'FNI', href: '/inventory/fni', icon: FlaskConical },
        { label: 'Suppliers', href: '/inventory/suppliers', icon: Users },
        { label: 'Pest & Disease', href: '/inventory/pest-disease', icon: Shield },
      ];
    
    case 'worker':
      return [
        { label: 'Dashboard', href: '/worker', icon: Home, exact: true },
        { label: 'Incidence Reports', href: '/worker/incidences', icon: AlertTriangle },
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

const timestampOf = (notif) => {
  if (!notif) return 0;
  const stamp = notif.updatedAt || notif.createdAt;
  if (!stamp) return 0;
  const time = new Date(stamp).getTime();
  return Number.isFinite(time) ? time : 0;
};

const Navbar = () => {
  const navigate = useNavigate();
  const [{ authed, user, token }, setAuth] = useState(readAuth());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const isLightTheme = theme === 'tea-light';
  const dropdownPanelClasses = isLightTheme
    ? 'bg-white/95 text-emerald-900 border-emerald-200 shadow-xl'
    : 'bg-base-200/95 text-base-content border-base-content/10 shadow-2xl';
  const accountMenuClasses = isLightTheme
    ? 'bg-white text-emerald-900 border-emerald-200 shadow-xl'
    : 'bg-base-300 text-base-content border-base-content/10 shadow-xl';
  const ackRef = useRef({});
  const userId = user?._id || user?.id;
  const ackStorageKey = useMemo(
    () => (userId ? `notif:seen:${userId}` : null),
    [userId]
  );

  const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : null), [token]);

  const computeUnread = useCallback((list) => {
    const ack = ackRef.current || {};
    if (!Array.isArray(list) || list.length === 0) return 0;
    const unread = list.reduce((total, notif) => {
      const id = notif?._id;
      const stamp = timestampOf(notif);
      const seen = id ? ack[id] || 0 : 0;
      return stamp > seen ? total + 1 : total;
    }, 0);
    console.debug('[navbar computeUnread]', {
      listLength: list.length,
      ackKeys: Object.keys(ack).length,
      unread,
      ids: list.map(n => n?._id),
      stamps: list.map(n => n?.updatedAt || n?.createdAt),
      seenEntries: Object.entries(ack).slice(0, 5),
    });
    return unread;
  }, []);

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!authed || !authHeader) {
      setNotifications([]);
      setNotifLoading(false);
      return [];
    }
    try {
      if (!silent) setNotifLoading(true);
      const res = await axios.get(`${API}/api/notifications`, { headers: authHeader });
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      console.debug('[navbar fetch] received', {
        count: items.length,
        ids: items.map(n => n._id),
        updated: items.map(n => n.updatedAt || n.createdAt),
      });
      setNotifications(items);
      setUnreadCount(computeUnread(items));
      return items;
    } catch (error) {
      console.error('[navbar notifications]', error?.response?.status, error?.response?.data);
      return [];
    } finally {
      if (!silent) setNotifLoading(false);
    }
  }, [authed, authHeader, computeUnread]);

  useEffect(() => {
    if (!ackStorageKey) {
      ackRef.current = {};
    } else {
      try {
        const raw = localStorage.getItem(ackStorageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        ackRef.current = parsed && typeof parsed === 'object' ? parsed : {};
      } catch (error) {
        console.warn('[navbar seen] failed to parse storage', error);
        ackRef.current = {};
      }
    }
    console.debug('[navbar seen init]', {
      key: ackStorageKey,
      entries: Object.entries(ackRef.current || {}).slice(0, 5),
    });
    setUnreadCount(computeUnread(notifications));
  }, [ackStorageKey, computeUnread, notifications]);

  useEffect(() => {
    if (!authed || !authHeader) {
      setNotifications([]);
      return;
    }

    const refresh = () => {
      fetchNotifications({ silent: true });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    refresh();

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(refresh, 5000);

    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [authed, authHeader, fetchNotifications]);

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

  const badgeCount = unreadCount;
  const badgeLabel = badgeCount > 9 ? '9+' : `${badgeCount}`;
  const visibleNotifications = notifications.slice(0, 8);

  const handleLogout = useCallback(async () => {
    const confirmed = await Sweet.confirm('Are you sure you want to sign out?', 'Confirm Sign Out');
    if (!confirmed) return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-changed')); // notify listeners
    navigate('/login');
  }, [navigate]);

  const handleNotificationsOpen = useCallback(async () => {
    const items = await fetchNotifications();
    const list = Array.isArray(items) && items.length ? items : notifications;
    if (!list.length) {
      setUnreadCount(0);
      return;
    }

    const next = { ...(ackRef.current || {}) };
    list.forEach((notif) => {
      const id = notif?._id;
      const stamp = timestampOf(notif);
      if (id && stamp) {
        next[id] = stamp;
      }
    });

    let entries = Object.entries(next);
    if (entries.length > 200) {
      entries = entries
        .sort((a, b) => b[1] - a[1])
        .slice(0, 200);
    }
    ackRef.current = Object.fromEntries(entries);

    if (ackStorageKey) {
      try {
        localStorage.setItem(ackStorageKey, JSON.stringify(ackRef.current));
      } catch (error) {
        console.warn('[navbar] failed to persist seen map', error);
      }
    }
    console.debug('[navbar handleOpen] stored seen map', {
      entries: Object.entries(ackRef.current).slice(0, 5),
    });
    setUnreadCount(computeUnread(list));
  }, [fetchNotifications, notifications, computeUnread, ackStorageKey]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        isLightTheme
          ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 border-emerald-700 text-emerald-50 shadow-lg'
          : 'bg-base-300 border-base-content/10'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between relative">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative">
              <div
                className={`absolute -inset-1 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition ${
                  isLightTheme ? 'bg-emerald-400/30' : 'bg-emerald-500/20'
                }`}
              />
              <Leaf
                className={`relative w-6 h-6 sm:w-8 sm:h-8 transition ${
                  isLightTheme ? 'text-emerald-100 group-hover:text-emerald-50' : 'text-emerald-400 group-hover:text-emerald-300'
                }`}
              />
            </div>
            <span className="text-lg sm:text-2xl font-extrabold tracking-tight">
              <span className={isLightTheme ? 'text-emerald-100 drop-shadow-sm' : 'text-emerald-400'}>Ceylon</span>
              <span className={isLightTheme ? 'text-white drop-shadow-sm' : 'text-emerald-400'}>Leaf</span>
            </span>
          </Link>

          {/* Desktop Navigation for All Authenticated Users */}
          {authed && user?.role && (
            <nav className="hidden md:flex gap-1">
              {getRoleNavLinks(user.role).map((link) => {
                const hasIcon = Boolean(link.icon);
                return (
                  <NavLink 
                    key={link.href}
                    to={link.href} 
                    end={link.exact}
                    className={({ isActive }) => {
                      const layoutClass = hasIcon ? 'inline-flex items-center gap-1' : 'inline-flex items-center gap-0';
                      const paletteClass = isLightTheme
                        ? (isActive
                          ? 'bg-white/15 text-white shadow-sm'
                          : 'text-emerald-50 hover:text-white hover:bg-white/10')
                        : (isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-base-content hover:bg-base-content/10');
                      return `btn btn-ghost btn-sm transition-colors ${layoutClass} ${paletteClass}`;
                    }}
                  >
                    {hasIcon ? <link.icon size={18} /> : null}
                    <span className={hasIcon ? 'hidden lg:inline' : 'leading-none'}>{link.label}</span>
                  </NavLink>
                );
              })}
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
                  className={`btn btn-ghost btn-sm p-3 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation select-none relative ${
                    isLightTheme ? 'text-emerald-50 hover:bg-white/10 focus-visible:ring-white/40' : ''
                  }`}
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
              <div className="flex items-center gap-3">
                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 ${
                      isLightTheme
                        ? 'border-white/30 bg-white/10 text-emerald-50 hover:bg-white/20 focus-visible:ring-white/40'
                        : 'border-base-content/10 bg-base-content/5 hover:bg-base-content/10 focus-visible:ring-primary/60'
                    }`}
                    aria-label="Notifications"
                    onClick={handleNotificationsOpen}
                  >
                    {badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-error px-1 text-xs font-semibold text-white shadow-lg">
                        {badgeLabel}
                      </span>
                    )}
                    <Bell className={`h-5 w-5 ${notifLoading ? 'animate-pulse' : ''}`} />
                  </div>
                  <div
                    tabIndex={0}
                    className={`dropdown-content mt-3 w-[20rem] max-h-96 space-y-2 overflow-hidden rounded-2xl border backdrop-blur ${dropdownPanelClasses}`}
                  >
                    <div className="flex items-center justify-between px-4 pt-3">
                      <span
                        className={`text-sm font-semibold tracking-wide ${
                          isLightTheme ? 'text-emerald-800' : 'text-base-content/80'
                        }`}
                      >
                        Notifications
                      </span>
                      <button
                        className={`btn btn-ghost btn-xs ${
                          isLightTheme ? 'text-emerald-700 hover:bg-emerald-50' : ''
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          fetchNotifications();
                        }}
                      >
                        Refresh
                      </button>
                    </div>
                    <div className="px-4">
                      <div className="divider my-2"></div>
                    </div>
                    {notifLoading ? (
                      <div className="w-full px-4 pb-4 text-center text-sm opacity-70">
                        Loading...
                      </div>
                    ) : visibleNotifications.length === 0 ? (
                      <div className="w-full px-4 pb-4 text-center text-sm opacity-70">
                        No notifications to show.
                      </div>
                    ) : (
                      <div className="w-full max-h-64 overflow-y-auto px-4 pb-3 pr-5">
                        <div className="space-y-3">
                          {visibleNotifications.map((notif) => {
                            const stamp = notif?.updatedAt || notif?.createdAt;
                            return (
                              <article
                                key={notif._id}
                                className="rounded-xl border border-base-content/10 bg-base-100 p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                              >
                                <h3 className="text-sm font-semibold text-base-content/90 break-words">
                                  {notif.title || 'Notification'}
                                </h3>
                                <p className="mt-1 text-xs text-base-content/60">
                                  {stamp ? new Date(stamp).toLocaleString() : ''}
                                  {notif?.updatedAt && notif.updatedAt !== notif.createdAt ? ' (updated)' : ''}
                                </p>
                                <p className="mt-2 max-h-24 overflow-hidden text-sm leading-snug text-base-content/80 whitespace-pre-line break-words">
                                  {notif.content || ''}
                                </p>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {notifications.length > visibleNotifications.length && (
                      <div className="px-4 pb-3 text-right text-xs text-base-content/50">
                        Showing {visibleNotifications.length} of {notifications.length}
                      </div>
                    )}
                  </div>
                </div>
                {/* User chip with responsive styling */}
                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className={`flex items-center gap-2 rounded-full px-2 sm:px-3 py-1.5 transition cursor-pointer border ${
                      isLightTheme
                        ? 'border-white/20 bg-white/10 text-emerald-50 hover:bg-white/20'
                        : 'bg-base-content/5 border-base-content/10 hover:bg-base-content/10'
                    }`}
                  >
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 grid place-items-center text-white font-bold">
                      <span className="text-xs sm:text-sm leading-none">{initialsOf(user)}</span>
                      <div className="absolute -inset-0.5 rounded-full ring-1 ring-white/10"></div>
                    </div>
                    <div className="hidden sm:flex flex-col leading-tight">
                      <span className={`text-sm font-semibold ${isLightTheme ? 'text-emerald-50' : 'text-base-content'}`}>
                        {user?.name || user?.email || 'User'}
                      </span>
                      <span className={`text-xs sm:truncate max-w-[180px] ${isLightTheme ? 'text-emerald-100/80' : 'text-base-content/60'}`}>
                        {getRoleTitle(user?.role)}
                      </span>
                    </div>
                  </div>
                  {/* Dropdown menu for actions */}
                  <ul
                    tabIndex={0}
                    className={`dropdown-content menu rounded-box z-[9999] w-52 p-2 border mt-2 ${accountMenuClasses}`}
                  >
                    <li className="menu-title">
                      <span className={`text-xs ${isLightTheme ? 'text-emerald-600' : ''}`}>Account Info</span>
                    </li>
                    <li>
                      <div className="flex flex-col items-start p-2 cursor-default hover:bg-transparent">
                        <span className={`font-semibold text-sm ${isLightTheme ? 'text-emerald-900' : ''}`}>
                          {user?.name || 'User'}
                        </span>
                        <span className={`text-xs ${isLightTheme ? 'text-emerald-700/80' : 'opacity-70'}`}>
                          {user?.email || 'No email'}
                        </span>
                        <span
                          className={`text-xs mt-1 uppercase tracking-wide ${
                            isLightTheme ? 'text-emerald-600' : 'text-primary'
                          }`}
                        >
                          {getRoleTitle(user?.role)}
                        </span>
                      </div>
                    </li>
                    <div className="divider my-1"></div>
                    <li>
                      <button
                        onClick={() => {
                          toggleTheme();
                          document.activeElement?.blur();
                        }}
                        className={`flex items-center gap-2 w-full ${
                          isLightTheme ? 'text-emerald-700 hover:bg-emerald-50' : ''
                        }`}
                      >
                        {theme === 'tea-dark' ? (
                          <Sun className="w-4 h-4" />
                        ) : (
                          <Moon className="w-4 h-4" />
                        )}
                        {theme === 'tea-dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                      </button>
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
                          className={`flex items-center gap-2 w-full ${
                            isLightTheme ? 'text-emerald-700 hover:bg-emerald-50' : ''
                          }`}
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
                        className={`flex items-center gap-2 w-full ${
                          isLightTheme
                            ? 'text-red-600 hover:bg-red-100'
                            : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                        }`}
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
            <div
              className={`md:hidden absolute top-16 left-0 right-0 border-b shadow-lg mobile-menu-dropdown ${
                isLightTheme
                  ? 'bg-emerald-700/95 border-emerald-600 text-emerald-50 backdrop-blur'
                  : 'bg-base-300 border-base-content/10'
              }`}
            >
              <nav className="px-4 py-3 space-y-2">
                {getRoleNavLinks(user.role).map((link) => {
                  const hasIcon = Boolean(link.icon);
                  return (
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
                      className={`flex items-center ${hasIcon ? 'gap-3' : 'gap-1'} px-3 py-3 rounded-lg transition mobile-menu-item cursor-pointer ${
                        isLightTheme
                          ? 'text-emerald-50 hover:bg-white/10 active:bg-white/20'
                          : 'text-base-content hover:bg-base-content/10 active:bg-base-content/20'
                      }`}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation'
                      }}
                    >
                      {hasIcon ? <link.icon size={20} /> : null}
                      <span className="font-medium">{link.label}</span>
                    </div>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;





