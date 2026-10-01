/**
 * GRAND CAPITAL FINANCIAL - MAIN JAVASCRIPT
 * Calculator, Navigation, Filter & Modal Handlers
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileDrawer();
  initHeroCalculator();
  initMainCalculator();
  initServiceFilter();
  initApplicationModal();
  initPromoPopover();
});

// Mobile & Tablet Drawer Navigation
function initMobileDrawer() {
  const toggleBtns = document.querySelectorAll('#mobileMenuToggle, #hamburgerBtn, .menu-hamburger, .mobile-menu-toggle');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const closeBtn = document.getElementById('drawerClose');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!drawer || !overlay) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    overlay.classList.add('active');
    document.documentElement.classList.add('drawer-open');
    document.body.classList.add('drawer-open');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.documentElement.classList.remove('drawer-open');
    document.body.classList.remove('drawer-open');
    document.body.style.overflow = '';
  };

  window.closeMobileDrawer = closeDrawer;

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  });

  closeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeDrawer();
  });
  overlay?.addEventListener('click', (e) => {
    e.preventDefault();
    closeDrawer();
  });

  // Prevent background touch scrolling through overlay on mobile
  overlay?.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      closeDrawer();

      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      }
    });
  });
}

// Hero Quick Calculator
function initHeroCalculator() {
  const amountSlider = document.getElementById('heroAmountSlider');
  const amountDisplay = document.getElementById('heroAmountDisplay');
  const tenureSlider = document.getElementById('heroTenureSlider');
  const tenureDisplay = document.getElementById('heroTenureDisplay');
  const emiDisplay = document.getElementById('heroEmiDisplay');
  const totalDisplay = document.getElementById('heroTotalDisplay');

  if (!amountSlider || !tenureSlider) return;

  const updateHeroCalc = () => {
    const P = parseFloat(amountSlider.value);
    const tenureMonths = parseInt(tenureSlider.value);
    const annualRate = 9.99; // 9.99% p.a. standard ROI
    const r = (annualRate / 12) / 100;

    amountDisplay.textContent = '₹' + P.toLocaleString('en-IN');
    tenureDisplay.textContent = tenureMonths + ' Months';

    // EMI Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
    let emi = 0;
    if (r > 0) {
      const x = Math.pow(1 + r, tenureMonths);
      emi = Math.round((P * r * x) / (x - 1));
    } else {
      emi = Math.round(P / tenureMonths);
    }

    const totalPayable = emi * tenureMonths;

    emiDisplay.textContent = '₹' + emi.toLocaleString('en-IN');
    totalDisplay.textContent = '₹' + totalPayable.toLocaleString('en-IN');
  };

  amountSlider.addEventListener('input', updateHeroCalc);
  tenureSlider.addEventListener('input', updateHeroCalc);
  updateHeroCalc();
}

// Advanced Main Calculator
function initMainCalculator() {
  const amountRange = document.getElementById('mainCalcAmount');
  const amountInput = document.getElementById('mainCalcAmountInput');
  const tenureRange = document.getElementById('mainCalcTenure');
  const tenureInput = document.getElementById('mainCalcTenureInput');
  const rateRange = document.getElementById('mainCalcRate');
  const rateInput = document.getElementById('mainCalcRateInput');

  const displayEmi = document.getElementById('mainDisplayEmi');
  const displayPrincipal = document.getElementById('mainDisplayPrincipal');
  const displayInterest = document.getElementById('mainDisplayInterest');
  const displayTotal = document.getElementById('mainDisplayTotal');

  if (!amountRange || !tenureRange) return;

  const calculate = () => {
    const P = parseFloat(amountRange.value);
    const N = parseInt(tenureRange.value); // in months
    const R = parseFloat(rateRange ? rateRange.value : 9.99); // in % (ROI starting at 9.99%)

    const r = (R / 12) / 100;
    let emi = 0;

    if (r > 0) {
      const factor = Math.pow(1 + r, N);
      emi = Math.round((P * r * factor) / (factor - 1));
    } else {
      emi = Math.round(P / N);
    }

    const totalPayable = emi * N;
    const totalInterest = Math.max(0, totalPayable - P);

    if (displayEmi) displayEmi.textContent = '₹' + emi.toLocaleString('en-IN');
    if (displayPrincipal) displayPrincipal.textContent = '₹' + Math.round(P).toLocaleString('en-IN');
    if (displayInterest) displayInterest.textContent = '₹' + Math.round(totalInterest).toLocaleString('en-IN');
    if (displayTotal) displayTotal.textContent = '₹' + Math.round(totalPayable).toLocaleString('en-IN');
  };

  // Sync range with input
  amountRange.addEventListener('input', (e) => {
    if (amountInput) amountInput.value = e.target.value;
    calculate();
  });
  amountInput?.addEventListener('change', (e) => {
    let val = Math.min(Math.max(Number(e.target.value), 1000), 1200000);
    amountRange.value = val;
    amountInput.value = val;
    calculate();
  });

  tenureRange.addEventListener('input', (e) => {
    if (tenureInput) tenureInput.value = e.target.value;
    calculate();
  });
  tenureInput?.addEventListener('change', (e) => {
    let val = Math.min(Math.max(Number(e.target.value), 1), 120);
    tenureRange.value = val;
    tenureInput.value = val;
    calculate();
  });

  if (rateRange) {
    rateRange.addEventListener('input', (e) => {
      if (rateInput) rateInput.value = e.target.value;
      calculate();
    });
    rateInput?.addEventListener('change', (e) => {
      let val = Math.min(Math.max(Number(e.target.value), 8), 36);
      rateRange.value = val;
      rateInput.value = val;
      calculate();
    });
  }

  calculate();
}

// Services Category Filtering
function initServiceFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  if (!filterBtns.length || !serviceCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterCategory = btn.getAttribute('data-filter');

      serviceCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (filterCategory === 'all' || cardCategory === filterCategory) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Application Modal & Form Submission to WhatsApp / Email
function initApplicationModal() {
  const modal = document.getElementById('applyLoanModal');
  const openButtons = document.querySelectorAll('.trigger-apply-modal');
  const closeButton = document.getElementById('closeApplyModal');
  const applyForm = document.getElementById('quickLoanApplyForm');

  if (!modal) return;

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const prefillService = btn.getAttribute('data-service');
      const loanTypeSelect = document.getElementById('modalLoanType');
      if (loanTypeSelect && prefillService) {
        loanTypeSelect.value = prefillService;
      }
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  closeButton?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (applyForm) {
    applyForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Bot honeypot spam check
      const honeypot = document.getElementById('applyHoneypot')?.value;
      if (honeypot) {
        console.warn('Spam submission detected and blocked.');
        return;
      }

      const name = document.getElementById('applyName')?.value.trim();
      const rawPhone = document.getElementById('applyPhone')?.value.trim();
      const loanType = document.getElementById('modalLoanType')?.value;
      const amount = document.getElementById('applyAmount')?.value.trim();
      const city = document.getElementById('applyCity')?.value.trim() || 'Boisar';

      const cleanPhone = rawPhone ? rawPhone.replace(/[^0-9]/g, '') : '';
      if (!name || cleanPhone.length < 10) {
        alert('Please enter a valid full name and 10-digit mobile number.');
        return;
      }

      // Save lead immediately to Local Storage & Appwrite Cloud for Admin
      if (typeof saveLeadToCloud === 'function') {
        saveLeadToCloud({
          name: name,
          phone: cleanPhone,
          loanType: loanType,
          amount: amount || 'Not Specified',
          location: city
        });
      }

      // Format WhatsApp message to 9284841551
      const message = `*Grand Capital Financial - Loan Application*%0A%0A` +
        `👤 *Name:* ${encodeURIComponent(name)}%0A` +
        `📞 *Phone:* ${encodeURIComponent(cleanPhone)}%0A` +
        `💼 *Loan Type:* ${encodeURIComponent(loanType)}%0A` +
        `💰 *Requested Amount:* ₹${encodeURIComponent(amount || 'Not Specified')}%0A` +
        `📍 *City/Location:* ${encodeURIComponent(city)}%0A%0A` +
        `_Sent via Grand Capital Financial Portal_`;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=919284841551&text=${message}`;
      
      closeModal();
      window.open(whatsappUrl, '_blank');
      applyForm.reset();
    });
  }
}

// Promo Popover (Bajaj Life & HDFC Life collaboration notification)
function initPromoPopover() {
  const popover = document.getElementById('promoPopover');
  const closeBtn = document.getElementById('closePromoBtn');

  if (!popover || !closeBtn) return;

  closeBtn.addEventListener('click', () => {
    popover.classList.add('hidden');
    sessionStorage.setItem('gcf_promo_closed', 'true');
  });

  if (sessionStorage.getItem('gcf_promo_closed') === 'true') {
    popover.classList.add('hidden');
  }
}
