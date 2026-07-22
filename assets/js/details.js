// Shopee Xpress Rider App - Dynamic Parcel Details Logic

const PARCEL_DATA = {
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
    aiScore: "71%",
    riskLevel: "LOW RISK",
    riskBadgeClass: "low",
    riskTitle: "🟢 Standard Delivery Route",
    warningPill: "Regular Address Verified",
    riskTags: ["Standard Route", "Normal Volume", "Attempt 1"],
    timingSlot: "11:00 AM – 1:00 PM",
    timingHub: "Cainta North Hub (HUB_A_NORTH)",
    timingSub: "Highest success probability · 71%",
    smsPrompt: "Hi Juan! Shopee Xpress rider Juan will deliver package SPX1234567890 today. Please reply to confirm availability."
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
    aiScore: "93%",
    riskLevel: "LOW RISK",
    riskBadgeClass: "low",
    riskTitle: "🟢 High Confidence Route",
    warningPill: "Prepaid Verified Address",
    riskTags: ["Optimal Route", "Clear Address", "Prepaid Enterprise"],
    timingSlot: "9:00 AM – 11:00 AM",
    timingHub: "Cainta North Hub (HUB_A_NORTH)",
    timingSub: "Highest success probability · 93%",
    smsPrompt: "Hi Maria! Shopee Xpress rider Juan will deliver package SPX0987654321 today. Please reply to confirm availability."
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
    aiScore: "45%",
    riskLevel: "MEDIUM RISK",
    riskBadgeClass: "medium",
    riskTitle: "🟡 Sorting Backlog Alert",
    warningPill: "Hub sorting backlog detected at HUB_A_NORTH",
    riskTags: ["Hub Backlog", "COD Risk", "No Landmark"],
    timingSlot: "2:00 PM – 4:00 PM",
    timingHub: "Cainta North Hub (HUB_A_NORTH)",
    timingSub: "Optimal time window for COD availability",
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
    aiScore: "26%",
    riskLevel: "HIGH RISK",
    riskBadgeClass: "high",
    riskTitle: "🔴 Routing & Address Risk",
    warningPill: "Missing house/unit number in address string",
    riskTags: ["Routing Delay", "Missing Unit Number", "3 Past Retries"],
    timingSlot: "9:00 AM – 11:00 AM",
    timingHub: "Cainta North Hub (HUB_A_NORTH)",
    timingSub: "Pre-verification required before dispatch",
    smsPrompt: "Hi Mark! Your Shopee Express parcel is on the way. Pls confirm if you're available or provide a landmark near 91 East Rd., Brgy. Sta. Clara. Reply YES or call us."
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Read tracking number from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const trackingParam = urlParams.get('tracking') || "SPX1234567890";
  
  const data = PARCEL_DATA[trackingParam] || PARCEL_DATA["SPX1234567890"];

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

  // Risk Warning Card
  const riskCardHeaderTitle = document.getElementById('riskCardHeaderTitle');
  const riskBadgeEl = document.getElementById('riskBadgeEl');
  const riskWarningPillText = document.getElementById('riskWarningPillText');
  const riskTagsContainer = document.getElementById('riskTagsContainer');

  riskCardHeaderTitle.textContent = data.riskTitle;
  riskBadgeEl.textContent = data.riskLevel;
  riskBadgeEl.className = `risk-badge ${data.riskBadgeClass}`;
  riskWarningPillText.textContent = data.warningPill;

  riskTagsContainer.innerHTML = data.riskTags.map(tag => `<span class="risk-tag-dark">${tag}</span>`).join('');

  // Timing Card
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
      alert(`[AI Pre-Verification Prompt Sent via Mistral AI]\n\nTo: ${data.name} (${data.phone})\n\n"${data.smsPrompt}"`);
    });
  }

  // Update status.html link with tracking param
  const chooseStatusBtn = document.getElementById('chooseStatusBtn');
  if (chooseStatusBtn) {
    chooseStatusBtn.href = `status.html?tracking=${data.trackingNo}`;
  }
});
