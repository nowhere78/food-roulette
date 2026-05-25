// State Management
let menuItems = [];
const maxItems = 10;

// Colors for roulette slices
const sliceColors = [
  '#ff2a74', // neon pink
  '#00f0ff', // neon blue
  '#9d4edd', // neon purple
  '#ff9f1c', // orange
  '#2ec4b6', // teal
  '#e71d36', // red
  '#ff007f', // hot pink
  '#3a86c8', // soft blue
  '#70e000', // lime green
  '#ffbe0b'  // yellow
];

// Presets mapping
const presets = {
  lunch: ['김치찌개', '제육볶음', '짜장면', '돈가스', '초밥', '부대찌개', '샌드위치'],
  dinner: ['삼겹살', '치킨', '족발/보쌈', '피자', '곱창', '마라탕', '닭발', '회'],
  snack: ['떡볶이', '감자칩', '도넛', '마카롱', '아이스크림', '크로플', '초콜릿 케이크']
};

// DOM Elements
const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
const menuInput = document.getElementById('menu-input');
const addBtn = document.getElementById('add-btn');
const menuList = document.getElementById('menu-list');
const itemCountText = document.getElementById('item-count');
const spinBtn = document.getElementById('spin-btn');
const resetBtn = document.getElementById('reset-btn');
const resultModal = document.getElementById('result-modal');
const resultName = document.getElementById('result-name');
const closeModalBtn = document.getElementById('close-modal');
const recLink = document.getElementById('rec-link');
const recItemName = document.getElementById('rec-item-name');

// Audio for ticking sound effect (synthesized using Web Audio API)
let audioCtx;
function playTickSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (e) {
    // Web audio fail-safe
  }
}

// Draw Wheel Function
let currentRotation = 0;
function drawWheel(rotationAngle = 0) {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 10;
  
  ctx.clearRect(0, 0, size, size);
  
  const len = menuItems.length;
  
  if (len === 0) {
    // Draw Empty Placeholder Wheel
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#14182e';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();
    
    // Text placeholder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 16px "Noto Sans KR"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('선택지를 추가해주세요', center, center);
    return;
  }
  
  const arcSize = (2 * Math.PI) / len;
  
  for (let i = 0; i < len; i++) {
    const angle = rotationAngle + (i * arcSize);
    
    // Draw Slice
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, angle, angle + arcSize);
    ctx.closePath();
    ctx.fillStyle = sliceColors[i % sliceColors.length];
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#14182e';
    ctx.stroke();
    
    // Draw Text on Slice
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle + arcSize / 2);
    
    ctx.fillStyle = '#ffffff';
    // Add text shadow for legibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 14px "Noto Sans KR"';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const text = menuItems[i];
    ctx.fillText(text, radius - 25, 0);
    ctx.restore();
  }
  
  // Draw Outer Border Glow/Ring
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.stroke();
}

// Add Item
function addItem(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (menuItems.length >= maxItems) {
    alert(`최대 ${maxItems}개까지만 입력할 수 있습니다!`);
    return;
  }
  if (menuItems.includes(trimmed)) {
    alert('이미 존재하는 항목입니다.');
    return;
  }
  
  menuItems.push(trimmed);
  updateUI();
  menuInput.value = '';
  menuInput.focus();
}

// Delete Item
function deleteItem(index) {
  menuItems.splice(index, 1);
  updateUI();
}

// Update UI & Redraw Wheel
function updateUI() {
  // Update counter
  itemCountText.textContent = `${menuItems.length} / ${maxItems}`;
  
  // Render list
  menuList.innerHTML = '';
  menuItems.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'menu-item';
    li.innerHTML = `
      <span class="menu-item-text">${item}</span>
      <button class="delete-btn" onclick="deleteItem(${index})">×</button>
    `;
    menuList.appendChild(li);
  });
  
  drawWheel(currentRotation);
}

// Load Preset
function loadPreset(key) {
  if (presets[key]) {
    menuItems = [...presets[key]];
    updateUI();
  }
}

// Spin Wheel Logic
let isSpinning = false;
function spin() {
  if (isSpinning) return;
  if (menuItems.length < 2) {
    alert('선택지를 최소 2개 이상 등록해 주세요!');
    return;
  }
  
  isSpinning = true;
  spinBtn.disabled = true;
  
  const spinDuration = 4000; // 4 seconds
  const start = performance.now();
  
  // Determine target rotation
  const baseSpins = 5 + Math.random() * 5; // 5 to 10 full spins
  const totalTargetRotation = currentRotation + (baseSpins * 2 * Math.PI);
  
  let lastTickAngle = 0;
  const tickThreshold = (2 * Math.PI) / menuItems.length;

  function animate(timestamp) {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / spinDuration, 1);
    
    // Easing out cubic curve
    const easeOutQuad = 1 - Math.pow(1 - progress, 3);
    const angle = currentRotation + (totalTargetRotation - currentRotation) * easeOutQuad;
    
    drawWheel(angle);
    
    // Play tick sound when passing a slice boundary
    if (Math.abs(angle - lastTickAngle) >= tickThreshold) {
      playTickSound();
      lastTickAngle = angle;
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Done spinning
      currentRotation = angle % (2 * Math.PI);
      isSpinning = false;
      spinBtn.disabled = false;
      
      showResult();
    }
  }
  
  requestAnimationFrame(animate);
}

// Dynamic Coupang Affiliate Items for Bottom Marquee Banner
const rollingProducts = [
  { name: '로켓프레시 한돈 삼겹살 구이용 1kg', price: '19,800원', discount: '20% 세일' },
  { name: '순살 닭강정 밀키트 (에어프라이어용)', price: '8,900원', discount: '특가' },
  { name: '마감세일 곰곰 광어회 + 연어회 세트', price: '16,500원', discount: '마감임박' },
  { name: '정통 이탈리안 밀푀유나베 간편 쿠킹박스', price: '12,900원', discount: '로켓프레시' },
  { name: '소문난 부산식 가래떡 떡볶이 패키지', price: '5,400원', discount: '인기상품' },
  { name: '아메리칸 스타일 페퍼로니 피자 2판', price: '11,800원', discount: '반값찬스' }
];

// Populate Bottom Marquee Banner
function initRollingBanner() {
  const track = document.getElementById('rolling-track');
  if (!track) return;

  // Double the array to make seamless marquee loop
  const list = [...rollingProducts, ...rollingProducts];
  track.innerHTML = list.map(prod => {
    // Replace with your real Coupang partners sub-link if needed
    const affiliateUrl = `https://link.coupang.com/a/custom-food-search?q=${encodeURIComponent(prod.name)}`;
    return `
      <a href="${affiliateUrl}" target="_blank" class="rolling-item">
        📌 <span class="highlight">[${prod.discount}]</span> ${prod.name} ➔ <span style="color:#00f0ff; font-weight:bold;">${prod.price}</span>
      </a>
    `;
  }).join('');
}

// Dynamic Coupang Affiliate Items for Bottom Marquee Banner
const rollingProducts = [
  { name: '로켓프레시 한돈 삼겹살 구이용 1kg', price: '19,800원', discount: '20% 세일' },
  { name: '순살 닭강정 밀키트 (에어프라이어용)', price: '8,900원', discount: '특가' },
  { name: '마감세일 곰곰 광어회 + 연어회 세트', price: '16,500원', discount: '마감임박' },
  { name: '정통 이탈리안 밀푀유나베 간편 쿠킹박스', price: '12,900원', discount: '로켓프레시' },
  { name: '소문난 부산식 가래떡 떡볶이 패키지', price: '5,400원', discount: '인기상품' },
  { name: '아메리칸 스타일 페퍼로니 피자 2판', price: '11,800원', discount: '반값찬스' }
];

// Populate Bottom Marquee Banner
function initRollingBanner() {
  const track = document.getElementById('rolling-track');
  if (!track) return;

  // Double the array to make seamless marquee loop
  const list = [...rollingProducts, ...rollingProducts];
  track.innerHTML = list.map(prod => {
    // Replace with user's Coupang Partners URL. 
    // Sub-link routing handles search context or routes to Home
    const affiliateUrl = `https://link.coupang.com/a/d2lDJO6mpE`;
    return `
      <a href="${affiliateUrl}" target="_blank" class="rolling-item">
        📌 <span class="highlight">[${prod.discount}]</span> ${prod.name} ➔ <span style="color:#00f0ff; font-weight:bold;">${prod.price}</span>
      </a>
    `;
  }).join('');
}

// Show Result Modal
function showResult() {
  const len = menuItems.length;
  const arcSize = (2 * Math.PI) / len;
  
  // The pointer is at the top (which is -Math.PI / 2, or 270 degrees)
  // Calculate which slice aligns with the pointer
  const pointerAngle = (1.5 * Math.PI) - currentRotation;
  let normalizedAngle = pointerAngle % (2 * Math.PI);
  if (normalizedAngle < 0) normalizedAngle += (2 * Math.PI);
  
  const winningIndex = Math.floor(normalizedAngle / arcSize) % len;
  const winnerName = menuItems[winningIndex];
  
  // Display result
  resultName.textContent = winnerName;
  
  // Update Coupang link dynamically
  recItemName.textContent = winnerName;
  // Route to the user's Coupang Partners Home Link (automatically tracks all purchases within 24h)
  recLink.href = `https://link.coupang.com/a/d2lDJO6mpE`;
  
  // Show Modal
  resultModal.classList.add('show');
}


// Event Listeners
addBtn.addEventListener('click', () => addItem(menuInput.value));
menuInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addItem(menuInput.value);
});

spinBtn.addEventListener('click', spin);

resetBtn.addEventListener('click', () => {
  if (confirm('모든 선택지를 초기화하시겠습니까?')) {
    menuItems = [];
    updateUI();
  }
});

// Setup Preset tags click
document.querySelectorAll('.preset-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    loadPreset(tag.dataset.preset);
  });
});

closeModalBtn.addEventListener('click', () => {
  resultModal.classList.remove('show');
});

// Window exposure for inline onclick attribute
window.deleteItem = deleteItem;

// Initial Setup
updateUI();
initRollingBanner();

