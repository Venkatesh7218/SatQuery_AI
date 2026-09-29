/**
 * SatQuery-AI - Signup Form Logic, Validation & Password Match
 */

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.querySelector('.signup-form');
  const fullnameInput = document.getElementById('fullname');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const termsCheckbox = document.getElementById('terms');
  const submitBtn = document.querySelector('.btn-submit');

  // ==========================================
  // 1. Password Toggles (Main & Confirm)
  // ==========================================
  function setupToggle(btnId, inputId, iconId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (btn && input && icon) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.classList.toggle('fa-eye', isPassword);
        icon.classList.toggle('fa-eye-slash', !isPassword);
      });
    }
  }

  setupToggle('togglePassword', 'password', 'passwordIcon');
  setupToggle('toggleConfirmPassword', 'confirmPassword', 'confirmPasswordIcon');

  // ==========================================
  // 2. Real-time Password Matching Feedback
  // ==========================================
  if (confirmPasswordInput && passwordInput) {
    confirmPasswordInput.addEventListener('input', () => {
      const pass = passwordInput.value;
      const confirm = confirmPasswordInput.value;

      if (confirm && pass !== confirm) {
        confirmPasswordInput.style.borderColor = '#ef4444';
      } else if (confirm && pass === confirm) {
        confirmPasswordInput.style.borderColor = '#10b981';
      } else {
        confirmPasswordInput.style.borderColor = 'rgba(255, 255, 255, 0.12)';
      }
    });
  }

  // ==========================================
  // 3. Form Submission Validation & Loading
  // ==========================================
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      const fullname = fullnameInput ? fullnameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
      const termsAgreed = termsCheckbox ? termsCheckbox.checked : false;

      // Validate inputs
      if (!fullname || !email || !password || !confirmPassword) {
        e.preventDefault();
        showToast('Please fill out all required fields.', 'error');
        return;
      }

      if (password.length < 8) {
        e.preventDefault();
        showToast('Password must be at least 8 characters long.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        e.preventDefault();
        showToast('Passwords do not match.', 'error');
        return;
      }

      if (!termsAgreed) {
        e.preventDefault();
        showToast('Please agree to the Terms & Privacy Policy.', 'error');
        return;
      }

      // Show submitting state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <span>Creating Space Account...</span>
        `;
        submitBtn.style.opacity = '0.85';
      }
    });
  }

  // ==========================================
  // Helper: Toast Notification
  // ==========================================
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.sat-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `sat-toast ${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
      <span>${message}</span>
    `;

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

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});