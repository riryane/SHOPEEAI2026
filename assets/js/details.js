// Shopee Express Rider App - Dynamic & Automated Live AI Details Logic

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
    smsPrompt: "Hi Juan! Shopee Xpress rider Juan will deliver package SPX1234567890 today."
  },
  "SPX0987654321": {
    parcelId: "P0000003",
    trackingNo: "SPX0987654321",
    name: "Maria Santos",
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
    timingSlot: "2:00 PM – 4:00 PM",
    timingHub: "Cainta North Hub (HUB_A_NORTH)",
    timingSub: "Optimal time window for COD customer availability",
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
    timingSlot: "9:00 AM – 11:00 AM",
    timingHub: "Cainta North Hub (HUB_A_NORTH)",
    timingSub: "Pre-verification required before dispatch",
    smsPrompt: "Hi Mark! Your Shopee Express parcel is on the way. Pls confirm if you're available or provide a landmark near 91 East Rd., Brgy. Sta. Clara. Reply YES or call us."
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // Read tracking number from URL query string or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const trackingParam = urlParams.get('tracking') || localStorage.getItem('selectedTracking') || "SPX1234567890";
  
  let data = PARCEL_DATA_MAP[trackingParam] || PARCEL_DATA_MAP["SPX1234567890"];

  // AUTOMATIC LIVE BACKEND FETCH
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/parcels/${trackingParam}`);
    if (response.ok) {
      const resJson = await response.json();
      const info = resJson.parcel_info;
      const ai = resJson.ai_analysis;

      data.name = info.customer_name;
      data.address = info.address;
      data.payment = info.payment_method;
      data.price = info.price;
      data.aiScore = `${info.ml_success_score}%`;
      
      if (ai) {
        if (ai.sms_prompt) data.smsPrompt = ai.sms_prompt;
        if (ai.address_issue) data.warningPill = ai.address_issue;
        if (ai.recommended_time_slot) data.timingSlot = ai.recommended_time_slot;
      }
      console.log("⚡ Successfully fetched live backend AI predictions from FastAPI!");
    }
  } catch (err) {
    console.warn("Backend API offline, using dynamic dataset mapping:", err);
  }

  // Populate HTML elements dynamically
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

  // Copy tracking button
  document.getElementById('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(data.trackingNo);
    alert(`Tracking number ${data.trackingNo} copied!`);
  });

  // Action Buttons (Call / SMS Pre-Verification)
  const smsBtn = document.getElementById('smsBtn');
  if (smsBtn) {
    smsBtn.addEventListener('click', () => {
      alert(`[Automated Mistral AI Pre-Verification SMS]\n\nTo: ${data.name} (${data.phone})\n\n"${data.smsPrompt}"`);
    });
  }

  // Update status.html link with tracking param
  const chooseStatusBtn = document.getElementById('chooseStatusBtn');
  if (chooseStatusBtn) {
    chooseStatusBtn.href = `status.html?tracking=${data.trackingNo}`;
  }
});
