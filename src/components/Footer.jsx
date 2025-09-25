import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Home,
  BarChart2,
  Wrench,
  FlaskConical,
  Users,
  Factory,
  Package,
  Calendar,
  Shield,
  Truck,
  FileText,
  User
} from 'lucide-react';

/* Read auth state from localStorage safely */
const readAuth = () => {
  const token = localStorage.getItem('token');
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
  const authed = Boolean(token && user && user.role);
  return { authed, token, user };
};

const Footer = () => {
  const [{ authed, user }, setAuth] = useState(readAuth());

  /* Keep Footer updated after login/logout and across tabs */
  useEffect(() => {
    const onAuth = () => setAuth(readAuth());
    window.addEventListener('auth-changed', onAuth);
    window.addEventListener('storage', onAuth);
    return () => {
      window.removeEventListener('auth-changed', onAuth);
      window.removeEventListener('storage', onAuth);
    };
  }, []);

  // Get role-specific links
  const getRoleLinks = (role) => {
    switch (role) {
      case 'admin':
        return [
          { label: 'Dashboard', href: '/admin', icon: Home },
          { label: 'Manage Users', href: '/admin/users', icon: Users },
          { label: 'Fields', href: '/admin/fields', icon: MapPin },
          { label: 'Notifications', href: '/admin/notifications', icon: Mail },
        ];
      
      case 'field_supervisor':
        return [
          { label: 'Dashboard', href: '/supervisor', icon: Home },
          { label: 'Attendance', href: '/supervisor/attendance', icon: Calendar },
          { label: 'Task Assignment', href: '/supervisor/tasks', icon: Users },
          { label: 'Pest & Disease', href: '/supervisor/pestdisease', icon: Shield },
          { label: 'Reports', href: '/reports', icon: FileText },
        ];
      
      case 'production_manager':
        return [
          { label: 'Dashboard', href: '/production-dashboard', icon: Home },
          { label: 'Production Batches', href: '/production-batches', icon: Package },
          { label: 'Vehicle Tracking', href: '/vehicle-tracking', icon: Truck },
          { label: 'Transport', href: '/transports', icon: Truck },
          { label: 'Reports', href: '/reports', icon: FileText },
        ];
      
      case 'inventory_manager':
        return [
          { label: 'Dashboard', href: '/inventory', icon: Home },
          { label: 'Tools', href: '/inventory/tools', icon: Wrench },
          { label: 'FNI', href: '/inventory/fni', icon: FlaskConical },
          { label: 'Reports', href: '/inventory/reports', icon: BarChart2 },
        ];
      
      case 'worker':
        return [
          { label: 'Dashboard', href: '/worker', icon: Home },
          { label: 'Profile', href: '/profile', icon: User },
        ];
      
      default:
        return [
          { label: 'Home', href: '/', icon: Home },
          { label: 'About', href: '#about', icon: Leaf },
          { label: 'Contact', href: '#contact', icon: Mail },
        ];
    }
  };

  const publicLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'About Us', href: '#about', icon: Leaf },
    { label: 'Services', href: '#services', icon: Factory },
    { label: 'Contact', href: '#contact', icon: Mail },
  ];

  const currentYear = new Date().getFullYear();
  
  const roleLinks = authed && user?.role ? getRoleLinks(user.role) : publicLinks;

  return (
    <footer className="bg-base-200/95 backdrop-blur-sm border-t border-base-content/30 shadow-lg mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-xl bg-emerald-500/20 blur-sm opacity-75" />
                <Leaf className="relative w-8 h-8 text-emerald-400" />
              </div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-base-content">
                <span className="text-emerald-500">Ceylon</span>Leaf
              </span>
            </div>
            <p className="text-sm sm:text-base text-base-content/90 mb-4 leading-relaxed font-medium">
              Leading tea plantation management system providing comprehensive solutions for modern tea cultivation, processing, and distribution.
            </p>
            
            {/* Social Media Links */}
            <div className="flex gap-3">
              <a href="https://www.facebook.com/ceylonleaf" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-base-content/15 hover:bg-emerald-500/20 text-base-content/70 hover:text-emerald-500 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/ceylonleaf" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-base-content/15 hover:bg-emerald-500/20 text-base-content/70 hover:text-emerald-500 transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/ceylonleaf" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-base-content/15 hover:bg-emerald-500/20 text-base-content/70 hover:text-emerald-500 transition">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/company/ceylonleaf" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-base-content/15 hover:bg-emerald-500/20 text-base-content/70 hover:text-emerald-500 transition">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links - Role-based or Public */}
          <div>
            <h3 className="font-bold text-base-content mb-3 sm:mb-4">
              {authed && user?.role ? 'Quick Access' : 'Quick Links'}
            </h3>
            <ul className="space-y-2">
              {roleLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.href}
                    className="flex items-center gap-2 text-sm text-base-content/90 hover:text-emerald-500 transition group font-medium"
                  >
                    <link.icon className="w-4 h-4 opacity-70 group-hover:opacity-100 transition" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services/Features */}
          <div>
            <h3 className="font-bold text-base-content mb-3 sm:mb-4">Our Solutions</h3>
            <ul className="space-y-2">
              <li>
                <span className="flex items-center gap-2 text-sm text-base-content/90 font-medium">
                  <Leaf className="w-4 h-4 text-emerald-500" />
                  Tea Plantation Management
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2 text-sm text-base-content/90 font-medium">
                  <Factory className="w-4 h-4 text-emerald-500" />
                  Production Tracking
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2 text-sm text-base-content/90 font-medium">
                  <Wrench className="w-4 h-4 text-emerald-500" />
                  Inventory Management
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2 text-sm text-base-content/90 font-medium">
                  <Truck className="w-4 h-4 text-emerald-500" />
                  Transport Solutions
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2 text-sm text-base-content/90 font-medium">
                  <BarChart2 className="w-4 h-4 text-emerald-500" />
                  Analytics & Reports
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-base-content mb-3 sm:mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li>
                <span className="flex items-start gap-3 text-sm text-base-content/90 font-medium">
                  <MapPin className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                  <span>123 Tea Garden Road,<br />Nuwara Eliya,<br />Sri Lanka 22200</span>
                </span>
              </li>
              <li>
                <a 
                  href="tel:+94112345678" 
                  className="flex items-center gap-3 text-sm text-base-content/90 hover:text-emerald-500 transition font-medium"
                >
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span>+94 11 234 5678</span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:info@ceylonleaf.com" 
                  className="flex items-center gap-3 text-sm text-base-content/90 hover:text-emerald-500 transition font-medium"
                >
                  <Mail className="w-4 h-4 text-emerald-500" />
                  <span>info@ceylonleaf.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 sm:pt-8 border-t border-base-content/30">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-base-content/80 text-center sm:text-left font-medium">
              © {currentYear} CeylonLeaf. All rights reserved.
              {authed && user && (
                <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
                  Welcome back, <span className="font-semibold text-emerald-500">{user.name || user.email}</span>
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-xs text-base-content/80 font-medium">
              <Link to="/privacy" className="hover:text-emerald-500 transition">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-emerald-500 transition">
                Terms of Service
              </Link>
              {authed && (
                <Link to="/support" className="hover:text-emerald-500 transition">
                  Support
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;