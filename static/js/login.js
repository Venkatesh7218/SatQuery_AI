/**
 * SatQuery-AI - Login Form Logic & Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('.login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('togglePassword');
  const passwordIcon = document.getElementById('passwordIcon');
  const submitBtn = document.querySelector('.btn-submit');

  // ==========================================
  // 1. Password Show / Hide Toggle
  // ==========================================
  if (toggleBtn && passwordInput && passwordIcon) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      // Toggle Icon Classes
      passwordIcon.classList.toggle('fa-eye', isPassword);
      passwordIcon.classList.toggle('fa-eye-slash', !isPassword);
    });
  }

  // ==========================================
  // 2. Client-side Form Validation & UI Loading State
  // ==========================================
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

      if (!username || !password) {
        e.preventDefault();
        showToast('Please enter both your email/username and password.', 'error');
        return;
      }

      // If submit button exists, show loading feedback
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <span>Authenticating...</span>
        `;
        submitBtn.style.opacity = '0.85';
      }
    });
  }

  // ==========================================
  // Helper: Toast Notification
  // ==========================================
  function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existing = document.querySelector('.sat-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `sat-toast ${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
      <span>${message}</span>
    `;

    // Basic toast styling
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: type === 'error' ? 'rgba(239, 68, 68, 0.92)' : 'rgba(16, 185, 129, 0.92)',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '12px',
      backdropFilter: 'blur(12px)',
      fontSize: '0.88rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      zIndex: '9999',
      transition: 'all 0.3s ease',
      opacity: '0'
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Auto dismiss after 3.5s
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});