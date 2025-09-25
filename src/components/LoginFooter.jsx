import React from 'react';
import { Leaf, Mail, Phone } from 'lucide-react';

const LoginFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="absolute bottom-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-sm border-t border-white/10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-center sm:text-left">
          
          {/* Brand */}
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-semibold">
              <span className="text-emerald-400">Ceylon</span>Leaf
            </span>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-white/70">
            <a href="mailto:support@ceylonleaf.com" className="flex items-center gap-1 hover:text-emerald-400 transition">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">support@ceylonleaf.com</span>
              <span className="sm:hidden">Email Support</span>
            </a>
            <a href="tel:+94112345678" className="flex items-center gap-1 hover:text-emerald-400 transition">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">+94 11 234 5678</span>
              <span className="sm:hidden">Call Support</span>
            </a>
          </div>

          {/* Copyright */}
          <div className="text-xs text-white/60 text-center sm:text-right">
            © {currentYear} CeylonLeaf. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LoginFooter;