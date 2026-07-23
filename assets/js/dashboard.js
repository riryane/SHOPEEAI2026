// Shopee Xpress Rider App - Interactive JavaScript Logic

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const searchInput = document.getElementById('searchInput');
  const parcelCards = document.querySelectorAll('.parcel-card');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const modalOverlay = document.getElementById('parcelModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const completeDeliveryBtn = document.getElementById('completeDeliveryBtn');
  const toDeliverCountEl = document.getElementById('toDeliverCount');
  const deliveredCountEl = document.getElementById('deliveredCount');
  const headerCountEl = document.getElementById('headerCount');
  const filterBtn = document.getElementById('filterBtn');

  let activeTab = 'to-deliver'; // 'to-deliver' or 'delivered'
  let currentCard = null;
  let activeFilter = 'ALL'; // 'ALL', 'COD', 'PREPAID'

  // Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      filterParcels();
    });
  });

  // Search Filter
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterParcels();
    });
  }

  // Filter Button (Cycle ALL -> COD -> PREPAID)
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      if (activeFilter === 'ALL') {
        activeFilter = 'COD';
        filterBtn.style.color = '#388E3C';
        filterBtn.style.borderColor = '#388E3C';
      } else if (activeFilter === 'COD') {
        activeFilter = 'PREPAID';
        filterBtn.style.color = '#5C9CE6';
        filterBtn.style.borderColor = '#5C9CE6';
      } else {
        activeFilter = 'ALL';
        filterBtn.style.color = '#555555';
        filterBtn.style.borderColor = '#E0E0E0';
      }
      filterParcels();
    });
  }

  function filterParcels() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    parcelCards.forEach(card => {
      const name = card.dataset.name.toLowerCase();
      const tracking = card.dataset.tracking.toLowerCase();
      const address = card.dataset.address.toLowerCase();
      const status = card.dataset.status; // 'to-deliver' or 'delivered'
      const payment = card.dataset.payment; // 'COD' or 'PREPAID'

      const matchesSearch = name.includes(query) || tracking.includes(query) || address.includes(query);
      const matchesTab = status === activeTab;
      const matchesPayment = activeFilter === 'ALL' || payment === activeFilter;

      if (matchesSearch && matchesTab && matchesPayment) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Parcel Card Click -> Navigate to details.html with tracking parameter & localStorage
  parcelCards.forEach(card => {
    card.addEventListener('click', () => {
      const tracking = card.dataset.tracking;
      localStorage.setItem('selectedTracking', tracking);
      window.location.href = `details.html?tracking=${tracking}`;
    });
  });

  // Modal Actions
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
      }
    });
  }

  // Complete Delivery Action
  if (completeDeliveryBtn) {
    completeDeliveryBtn.addEventListener('click', () => {
      if (!currentCard) return;

      // Update card status
      currentCard.dataset.status = 'delivered';
      const statusIndicator = currentCard.querySelector('.status-indicator');
      if (statusIndicator) {
        statusIndicator.innerHTML = '<span class="status-dot" style="background-color: #388E3C;"></span> Delivered';
        statusIndicator.style.color = '#388E3C';
      }

      // Update counts
      let toDeliver = parseInt(toDeliverCountEl.textContent, 10);
      let delivered = parseInt(deliveredCountEl.textContent, 10);

      toDeliver = Math.max(0, toDeliver - 1);
      delivered += 1;

      toDeliverCountEl.textContent = toDeliver;
      deliveredCountEl.textContent = delivered;
      if (headerCountEl) headerCountEl.textContent = `${toDeliver} Deliveries`;

      // Update tab headers text
      document.getElementById('tabToDeliverText').textContent = `To Deliver (${toDeliver})`;
      document.getElementById('tabDeliveredText').textContent = `Delivered (${delivered})`;

      modalOverlay.classList.remove('active');
      filterParcels();
    });
  }

  // Real-Time Live Clock & Date in Rider App Header
  function updateRiderLiveClock() {
    const statusBarClock = document.querySelector('.status-bar span');
    const dateTextEl = document.querySelector('.date-text');
    const now = new Date();

    if (statusBarClock) {
      statusBarClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  updateRiderLiveClock();
  setInterval(updateRiderLiveClock, 1000);
});

