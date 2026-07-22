// Shopee Express Rider App - Dynamic & Instantaneous AI Details Logic (0ms Render)

const API_BASE_URL = "http://localhost:8000";

const PARCEL_DATA_MAP = {
  "SPX1234567890": {
    parcelId: "P0000001",
    trackingNo: "SPX1234567890",
    name: "Juan Dela Cruz",
    phone: "+63 912 345 6789",
    payment: "COD",
    price: "₱245.00",
    address: "Blk 4 Lot 12, Brgy. San Isidro, Cainta, Rizal",
    landmark: "Near blue gate beside sari-sari store",
    parcelType: "Small Box (1-3kg)",
    deliveryNotes: "Please call first before delivery.",
    aiScore: "70.6%",
    riskLevel: "LOW_RISK",
    riskTitle: "🟢 AI Delivery Success Verified",
    warningPill: "Regular Address Verified",
    riskTags: ["Standard Route", "Normal Hub Volume", "Attempt 1"],
    bgStyle: "#E8F5E9",
    borderStyle: "#A5D6A7",
    headerColor: "#1B5E20",
    badgeBg: "#C8E6C9",
    badgeColor: "#1B5E20",
    timingSlot: "11:00 AM – 1:00 PM",
    timingHub: "Cainta North Hub (HUB_A_NORTH)",
    timingSub: "Highest success probability · 70.6%",
    historyStat: "12 Orders · 100% Success Rate",
    historyInsight: "100% historical delivery success across 12 orders. Consistently receives COD packages during mid-day window (11:00 AM – 1:00 PM).",
    smsPrompt: "Hi Juan! Shopee Xpress rider Juan will deliver package SPX1234567890 today."
  },
  "SPX0987654321": {
    parcelId: "P0000003",
    name: "Maria Santos",
    trackingNo: "SPX0987654321",
    phone: "+63 918 234 5678",
    payment: "PREPAID",
    price: "₱0.00 (Prepaid)",
    address: "123 Mabini St., Brgy. Mabini, Cainta, Rizal",
    landmark: "Opposite barangay hall",
    parcelType: "Envelope (0-1kg)",
    deliveryNotes: "Leave at front desk if unavailable.",
    aiScore: "92.9%",
    riskLevel: "LOW_RISK",
    riskTitle: "🟢 High Confidence Delivery Route",
    warningPill: "Prepaid Verified Address",
    riskTags: ["Optimal Route", "Clear Address", "Prepaid Enterprise"],
    bgStyle: "#E8F5E9",
    borderStyle: "#A5D6A7",
    headerColor: "#1B5E20",
    badgeBg: "#C8E6C9",
    badgeColor: "#1B5E20",
    timingSlot: "9:00 AM – 11:00 AM",
    timingHub: "Cainta North Hub (HUB_A_NORTH)",
    timingSub: "Highest success probability · 92.9%",
    historyStat: "18 Orders · 100% Success Rate",
    historyInsight: "100% historical delivery success across 18 prepaid office orders during morning desk hours (9:00 AM – 11:00 AM).",
    smsPrompt: "Hi Maria! Shopee Xpress rider Juan will deliver package SPX0987654321 today."
  },
  "SPX5556677788": {
    parcelId: "P0000012",
    trackingNo: "SPX5556677788",
    name: "Alex Reyes",
    phone: "+63 920 345 6789",
    payment: "COD",
    price: "₱560.00",
    address: "28 Sunrise St., Brgy. San Isidro, Cainta, Rizal",
    landmark: "No landmark provided in system",
    parcelType: "Medium Box (3-5kg)",
    deliveryNotes: "Customer previously unavailable during COD delivery attempts.",
    aiScore: "45.1%",
    riskLevel: "MEDIUM_RISK",
    riskTitle: "🟡 Hub Backlog & Sorting Alert",
    warningPill: "Hub sorting backlog detected at HUB_A_NORTH",
    riskTags: ["Hub Backlog", "COD Risk", "No Landmark"],
    bgStyle: "#FFF8E1",
    borderStyle: "#FFE082",
    headerColor: "#E65100",
    badgeBg: "#FFE082",
    badgeColor: "#E65100",
    timingSlot: "3:00 PM – 5:00 PM (Personalized)",
    timingHub: "Cainta North Hub (HUB_A_NORTH)",
    timingSub: "Personalized window: All 3 past successful deliveries occurred after 3:00 PM",
    historyStat: "8 Orders · 37.5% Success Rate (5 COD Failures)",
    historyInsight: "CUSTOMER PERSONAL PATTERN: Alex Reyes fails morning COD attempts (unreachable at work 9am-1pm). All 3 successful past deliveries occurred AFTER 3:00 PM when home. AI personalized recommendation: Dispatch between 3:00 PM – 5:00 PM.",
    smsPrompt: "Hi Alex! Your order SPX5556677788 is on the way. Pls confirm if you're available for COD delivery today. Reply with a landmark near 28 Sunrise St. Thanks!"
  },
  "SPX1122334455": {
    parcelId: "P0000014",
    trackingNo: "SPX1122334455",
    name: "Mark Bautista",
    phone: "+63 922 456 7890",
    payment: "PREPAID",
    price: "₱0.00 (Prepaid)",
    address: "91 East Rd., Brgy. Sta. Clara, Cainta, Rizal",
    landmark: "Missing house/unit number in address string",
    parcelType: "Large Box (5-10kg)",
    deliveryNotes: "Multiple past delivery retries recorded due to routing delay.",
    aiScore: "25.7%",
    riskLevel: "HIGH_RISK",
    riskTitle: "🔴 Routing & Address Verification Risk",
    warningPill: "Missing house/unit number in address string",
    riskTags: ["Routing Delay", "Missing Unit Number", "3 Past Retries"],
    bgStyle: "#FFEBEE",
    borderStyle: "#FFCDD2",
    headerColor: "#B71C1C",
    badgeBg: "#FFCDD2",
    badgeColor: "#B71C1C",
    timingSlot: "10:00 AM – 12:00 PM (Post-Verification)",
    timingHub: "Cainta North Hub (HUB_A_NORTH)",
    timingSub: "Personalized window: Requires address unit verification first",
    historyStat: "6 Orders · 33.3% Success Rate (4 Address Failures)",
    historyInsight: "CUSTOMER PERSONAL PATTERN: Mark Bautista has 4 past address routing failures due to missing unit number on East Rd. Once unit number is verified via SMS, optimal delivery window is 10:00 AM – 12:00 PM.",
    smsPrompt: "Hi Mark! Your Shopee Express parcel is on the way. Pls confirm if you're available or provide a landmark near 91 East Rd., Brgy. Sta. Clara. Reply YES or call us."
  }
};

function renderUI(data) {
  // Populate HTML elements INSTANTLY
  document.getElementById('trackingNumText').textContent = `${data.trackingNo} (${data.parcelId})`;
  document.getElementById('customerNameText').textContent = data.name;
  document.getElementById('customerPhoneText').textContent = data.phone;
  document.getElementById('addressFullText').textContent = data.address;
  document.getElementById('addressLandmarkText').textContent = data.landmark;
  document.getElementById('parcelTypeVal').textContent = data.parcelType;
  document.getElementById('codPriceVal').textContent = data.price;
  document.getElementById('deliveryNotesText').textContent = data.deliveryNotes;

  // Payment Tag
  const paymentTagEl = document.getElementById('paymentTagEl');
  paymentTagEl.textContent = data.payment;
  paymentTagEl.className = `payment-tag ${data.payment.toLowerCase()}`;

  // Risk Warning Card Styling & Content
  const riskCard = document.getElementById('riskWarningCard');
  if (riskCard) {
    riskCard.style.backgroundColor = data.bgStyle;
    riskCard.style.borderColor = data.borderStyle;
  }

  const riskCardHeaderTitle = document.getElementById('riskCardHeaderTitle');
  if (riskCardHeaderTitle) {
    riskCardHeaderTitle.textContent = data.riskTitle;
    riskCardHeaderTitle.style.color = data.headerColor;
  }

  const riskBadgeEl = document.getElementById('riskBadgeEl');
  if (riskBadgeEl) {
    riskBadgeEl.textContent = data.riskLevel.replace('_', ' ');
    riskBadgeEl.style.backgroundColor = data.badgeBg;
    riskBadgeEl.style.color = data.badgeColor;
  }

  const riskWarningPillText = document.getElementById('riskWarningPillText');
  if (riskWarningPillText) {
    riskWarningPillText.textContent = data.warningPill;
  }

  const riskTagsContainer = document.getElementById('riskTagsContainer');
  if (riskTagsContainer) {
    riskTagsContainer.innerHTML = data.riskTags.map(tag => `<span class="risk-tag-dark">${tag}</span>`).join('');
  }

  // Dynamic Timing Card Content
  document.getElementById('timingHubText').textContent = data.timingHub;
  document.getElementById('timingSlotText').textContent = data.timingSlot;
  document.getElementById('timingSubText').textContent = data.timingSub;

  // Customer Personal History Card Content
  const historyStatPill = document.getElementById('historyStatPill');
  if (historyStatPill) {
    historyStatPill.textContent = data.historyStat;
  }
  const historyInsightText = document.getElementById('historyInsightText');
  if (historyInsightText) {
    historyInsightText.textContent = data.historyInsight;
  }

  // Copy tracking button
  document.getElementById('copyBtn').onclick = () => {
    navigator.clipboard.writeText(data.trackingNo);
    alert(`Tracking number ${data.trackingNo} copied!`);
  };

  // Action Buttons (Call / SMS Pre-Verification)
  const smsBtn = document.getElementById('smsBtn');
  if (smsBtn) {
    smsBtn.onclick = () => {
      alert(`[Automated Mistral AI Pre-Verification SMS]\n\nTo: ${data.name} (${data.phone})\n\n"${data.smsPrompt}"`);
    };
  }

  // Update status.html link with tracking param
  const chooseStatusBtn = document.getElementById('chooseStatusBtn');
  if (chooseStatusBtn) {
    chooseStatusBtn.href = `status.html?tracking=${data.trackingNo}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingParam = urlParams.get('tracking') || localStorage.getItem('selectedTracking') || "SPX1234567890";
  
  let data = PARCEL_DATA_MAP[trackingParam] || PARCEL_DATA_MAP["SPX1234567890"];

  // 1. INSTANT 0ms DOM RENDER
  renderUI(data);

  // 2. NON-BLOCKING SILENT BACKGROUND BACKEND SYNC
  fetch(`${API_BASE_URL}/api/v1/parcels/${trackingParam}`)
    .then(res => res.ok ? res.json() : null)
    .then(resJson => {
      if (resJson) {
        const info = resJson.parcel_info;
        const custHist = resJson.customer_personal_history;
        const ai = resJson.ai_analysis;

        data.name = info.customer_name;
        data.address = info.address;
        data.payment = info.payment_method;
        data.price = info.price;
        data.aiScore = `${info.ml_success_score}%`;
        
        if (custHist) {
          data.historyStat = `${custHist.total_past_parcels} Orders · ${custHist.personal_success_rate}% Success`;
          data.historyInsight = custHist.ai_personalized_insight;
          if (custHist.personalized_time_window) data.timingSlot = custHist.personalized_time_window;
        }

        if (ai) {
          if (ai.sms_prompt) data.smsPrompt = ai.sms_prompt;
          if (ai.address_issue) data.warningPill = ai.address_issue;
          if (ai.recommended_time_slot) data.timingSlot = ai.recommended_time_slot;
        }
        renderUI(data);
      }
    })
    .catch(() => {});
});
