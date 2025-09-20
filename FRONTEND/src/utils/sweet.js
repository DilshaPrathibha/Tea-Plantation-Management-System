// FRONTEND/src/utils/sweet.js
import Swal from 'sweetalert2';

/** Modal-style helpers (centered dialogs) */
const Sweet = {
  /** Success modal */
  success(message, title = 'Done') {
    return Swal.fire({ icon: 'success', title, text: String(message) });
  },

  /** Error modal */
  error(message, title = 'Oops') {
    return Swal.fire({ icon: 'error', title, text: String(message) });
  },

  /** Info/neutral modal */
  info(message, title = 'Info') {
    return Swal.fire({ icon: 'info', title, text: String(message) });
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
    });
    return { close: () => Swal.close() };
  },

  /** Back-compat: allow Sweet.fire({ icon, title, text }) style */
  fire(opts) {
    // if someone passes string, make it a simple info
    if (typeof opts === 'string') {
      return Swal.fire({ icon: 'info', title: 'Info', text: opts });
    }
    return Swal.fire({ ...opts });
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
      ...opts,
    });
  },
};

export { Sweet, Toast };
