// FRONTEND/src/utils/sweet.js
import Swal from 'sweetalert2';

// Dark theme configuration for SweetAlert2
const darkThemeConfig = {
  background: '#1f2937', // gray-800
  color: '#f3f4f6', // gray-100
  confirmButtonColor: '#10b981', // green-500
  cancelButtonColor: '#ef4444', // red-500
  iconColor: '#10b981', // green-500
  customClass: {
    popup: 'dark-popup',
    title: 'dark-title', 
    content: 'dark-content',
    confirmButton: 'dark-confirm-btn',
    cancelButton: 'dark-cancel-btn'
  }
};

// Add custom CSS for dark theme
const addDarkThemeStyles = () => {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') return;
  
  if (!document.getElementById('swal-dark-theme')) {
    const style = document.createElement('style');
    style.id = 'swal-dark-theme';
    style.textContent = `
      .dark-popup {
        background: #1f2937 !important;
        border: 1px solid #374151 !important;
      }
      .dark-title {
        color: #f3f4f6 !important;
      }
      .dark-content {
        color: #d1d5db !important;
      }
      .dark-confirm-btn {
        background: #10b981 !important;
        color: white !important;
        border: none !important;
      }
      .dark-confirm-btn:hover {
        background: #059669 !important;
      }
      .dark-cancel-btn {
        background: #ef4444 !important;
        color: white !important;
        border: none !important;
      }
      .dark-cancel-btn:hover {
        background: #dc2626 !important;
      }
      .swal2-icon.swal2-success [class^='swal2-success-line'] {
        background-color: #10b981 !important;
      }
      .swal2-icon.swal2-success .swal2-success-ring {
        border-color: #10b981 !important;
      }
      .swal2-icon.swal2-error .swal2-x-mark .swal2-x-mark-line-left,
      .swal2-icon.swal2-error .swal2-x-mark .swal2-x-mark-line-right {
        background-color: #ef4444 !important;
      }
      .swal2-icon.swal2-info {
        color: #3b82f6 !important;
        border-color: #3b82f6 !important;
      }
      .swal2-icon.swal2-question {
        color: #8b5cf6 !important;
        border-color: #8b5cf6 !important;
      }
      .swal2-timer-progress-bar {
        background: #10b981 !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// Initialize dark theme styles when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDarkThemeStyles);
  } else {
    addDarkThemeStyles();
  }
}

/** Modal-style helpers (centered dialogs) */
const Sweet = {
  /** Success modal */
  success(message, title = 'Done') {
    return Swal.fire({ 
      icon: 'success', 
      title, 
      text: String(message),
      ...darkThemeConfig
    });
  },

  /** Error modal */
  error(message, title = 'Oops') {
    return Swal.fire({ 
      icon: 'error', 
      title, 
      text: String(message),
      ...darkThemeConfig,
      confirmButtonColor: '#ef4444' // red for errors
    });
  },

  /** Info/neutral modal */
  info(message, title = 'Info') {
    return Swal.fire({ 
      icon: 'info', 
      title, 
      text: String(message),
      ...darkThemeConfig,
      confirmButtonColor: '#3b82f6' // blue for info
    });
  },

  /**
   * Confirmation modal → resolves boolean
   * Usage: const ok = await Sweet.confirm('Delete this user?');
   */
  confirm(msgOrOpts = 'Are you sure?', title = 'Please confirm') {
    const opts = typeof msgOrOpts === 'string'
      ? { text: msgOrOpts, title }
      : msgOrOpts;

    return Swal.fire({
      icon: opts.icon || 'question',
      title: opts.title ?? 'Please confirm',
      text: opts.text ?? 'Are you sure?',
      showCancelButton: true,
      confirmButtonText: opts.confirmButtonText || 'Yes',
      cancelButtonText: opts.cancelButtonText || 'Cancel',
      focusCancel: true,
      reverseButtons: true,
      ...darkThemeConfig,
      confirmButtonColor: '#10b981', // green for confirm
      cancelButtonColor: '#ef4444', // red for cancel
      ...opts,
    }).then(r => r.isConfirmed);
  },

  /**
   * Loading modal (call .close() on the returned handle)
   * const h = Sweet.loading('Saving...');
   * ...await...
   * h.close();
   */
  loading(message = 'Please wait...') {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
      ...darkThemeConfig,
      showConfirmButton: false
    });
    return { close: () => Swal.close() };
  },

  /** Back-compat: allow Sweet.fire({ icon, title, text }) style */
  fire(opts) {
    // if someone passes string, make it a simple info
    if (typeof opts === 'string') {
      return Swal.fire({ 
        icon: 'info', 
        title: 'Info', 
        text: opts,
        ...darkThemeConfig
      });
    }
    return Swal.fire({ 
      ...darkThemeConfig,
      ...opts 
    });
  },
};

/** Toast-style helpers (top-right, auto dismiss) */
const Toast = {
  success(message) {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: String(message),
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      ...darkThemeConfig
    });
  },
  error(message) {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: String(message),
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      ...darkThemeConfig
    });
  },
  info(message) {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: String(message),
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      ...darkThemeConfig
    });
  },

  /** Back-compat: allow Toast.fire({ icon, title, ... }) calls */
  fire(opts = {}) {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: opts.timer ?? 2000,
      timerProgressBar: true,
      ...darkThemeConfig,
      ...opts,
    });
  },
};

export { Sweet, Toast };
