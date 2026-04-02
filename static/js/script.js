'use strict';

const gender       = document.getElementById('gender');
const hipField     = document.getElementById('hipField');
const calcBtn      = document.getElementById('calculateBtn');
const form         = document.getElementById('bodyFatForm');

const resultEl     = document.getElementById('result');
const categoryEl   = document.getElementById('category');
const navyEl       = document.getElementById('navyResult');
const catTableEl   = document.getElementById('categoryTable');
const bmiEl        = document.getElementById('bmiResult');
const bmiFatEl     = document.getElementById('bmiBodyFat');
const fatMassEl    = document.getElementById('fatMass');
const leanMassEl   = document.getElementById('leanMass');
const thumbEl      = document.getElementById('scaleMarker');
const donutFatEl   = document.getElementById('donutFat');
const donutLeanEl  = document.getElementById('donutLean');
const donutPctEl   = document.getElementById('donutPct');
const silBadgeEl   = document.getElementById('silBadge');
const silParts     = document.querySelectorAll('.sil-body');

// logo fallback
const logoImg = document.getElementById('logoImg');
if (logoImg) {
  logoImg.addEventListener('error', () => logoImg.classList.add('img-error'));
}

const CAT_COLORS = {
  'Essential fat': '#ff4b4b',
  'Athletes':      '#ff9f2e',
  'Fitness':       '#32e87c',
  'Average':       '#f5d328',
  'Obese':         '#c0392b',
};

function getCategory(val, g) {
  if (g === 'male') {
    if (val <  6) return 'Essential fat';
    if (val < 14) return 'Athletes';
    if (val < 18) return 'Fitness';
    if (val < 25) return 'Average';
    return 'Obese';
  }
  if (val < 14) return 'Essential fat';
  if (val < 21) return 'Athletes';
  if (val < 25) return 'Fitness';
  if (val < 32) return 'Average';
  return 'Obese';
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25)   return 'Normal';
  if (bmi < 30)   return 'Overweight';
  return 'Obese';
}

function navyBF(height, neck, waist, hip, g) {
  if (g === 'male') {
    if (waist <= neck) throw new Error('Waist harus lebih besar dari neck.');
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  }
  if (!hip) throw new Error('Hip wajib diisi untuk female.');
  if (waist + hip <= neck) throw new Error('Waist + hip harus lebih besar dari neck.');
  return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(height)) - 450;
}

function bmiBF(bmi, age, g) {
  return (1.2 * bmi) + (0.23 * age) - (10.8 * (g === 'male' ? 1 : 0)) - 5.4;
}

function moveMarker(val) {
  const MIN = 2, MAX = 40;
  const pct = ((Math.min(Math.max(val, MIN), MAX) - MIN) / (MAX - MIN)) * 100;
  thumbEl.style.left = `${pct}%`;
}

const CIRCUMFERENCE = 2 * Math.PI * 48; // ≈ 301.6

function updateDonut(fatPct) {
  const fatFrac  = Math.min(Math.max(fatPct / 100, 0), 1);
  const leanFrac = 1 - fatFrac;

  const fatLen  = fatFrac  * CIRCUMFERENCE;
  const leanLen = leanFrac * CIRCUMFERENCE;

  // lean arc first (gold), fat arc offset after lean
  donutLeanEl.setAttribute('stroke-dasharray', `${leanLen} ${CIRCUMFERENCE - leanLen}`);
  donutLeanEl.setAttribute('stroke-dashoffset', '0');

  donutFatEl.setAttribute('stroke-dasharray', `${fatLen} ${CIRCUMFERENCE - fatLen}`);
  donutFatEl.setAttribute('stroke-dashoffset', `-${leanLen}`);

  donutPctEl.textContent = fatPct.toFixed(1) + '%';
}

function updateSilhouette(cat) {
  const colorMap = {
    'Essential fat': '#ff4b4b',
    'Athletes':      '#F5C200',
    'Fitness':       '#32e87c',
    'Average':       '#f5d328',
    'Obese':         '#c0392b',
  };
  const col = colorMap[cat] ?? 'rgba(255,255,255,0.12)';
  silParts.forEach(el => el.style.fill = col);

  silBadgeEl.textContent = cat;
  silBadgeEl.style.background = col + '28';
  silBadgeEl.style.color = col;
}

function animateCount(el, target, decimals = 1, suffix = '') {
  const start    = parseFloat(el.dataset.current || '0') || 0;
  const duration = 600;
  const t0       = performance.now();

  function step(now) {
    const p = Math.min((now - t0) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3); // ease-out-cubic
    const val  = start + (target - start) * ease;
    el.textContent = val.toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.dataset.current = target;
  }
  requestAnimationFrame(step);
}

function toggleHip() {
  hipField.style.display = gender.value === 'female' ? 'flex' : 'none';
}

function resetDisplay() {
  resultEl.textContent     = '--';
  resultEl.style.color     = '';
  categoryEl.textContent   = 'Belum dihitung';
  categoryEl.style.color   = '';
  navyEl.textContent       = '--';
  catTableEl.textContent   = '--';
  bmiEl.textContent        = '--';
  bmiFatEl.textContent     = '--';
  fatMassEl.textContent    = '-- kg';
  leanMassEl.textContent   = '-- kg';
  thumbEl.style.left       = '0%';
  donutFatEl  && donutFatEl.setAttribute('stroke-dasharray',  '0 302');
  donutLeanEl && donutLeanEl.setAttribute('stroke-dasharray', '0 302');
  if (donutPctEl) donutPctEl.textContent = '--';
  silParts.forEach(el => el.style.fill = '');
  if (silBadgeEl) { silBadgeEl.textContent = '--'; silBadgeEl.style.background = ''; silBadgeEl.style.color = ''; }

  [resultEl].forEach(el => delete el.dataset.current);
}

function calculate() {
  const age    = parseFloat(document.getElementById('age').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);
  const neck   = parseFloat(document.getElementById('neck').value);
  const waist  = parseFloat(document.getElementById('waist').value);
  const hip    = parseFloat(document.getElementById('hip').value) || 0;
  const g      = gender.value;

  if (!age || !weight || !height || !neck || !waist) {
    shakeForm();
    return;
  }

  try {
    const bf        = Math.max(navyBF(height, neck, waist, hip, g), 0);
    const bmi       = weight / Math.pow(height / 100, 2);
    const bfBmi     = Math.max(bmiBF(bmi, age, g), 0);
    const fatMass   = weight * (bf / 100);
    const leanMass  = weight - fatMass;
    const cat       = getCategory(bf, g);

    animateCount(resultEl, bf, 1, '');

    categoryEl.textContent   = cat;
    categoryEl.style.color   = CAT_COLORS[cat] ?? '';
    resultEl.style.color     = '#fff'; // keep white, accent on category

    navyEl.textContent       = `${bf.toFixed(1)} %`;
    catTableEl.textContent   = cat;
    bmiEl.textContent        = `${bmi.toFixed(1)} — ${getBmiCategory(bmi)}`;
    bmiFatEl.textContent     = `${bfBmi.toFixed(1)} %`;
    fatMassEl.textContent    = `${fatMass.toFixed(1)} kg`;
    leanMassEl.textContent   = `${leanMass.toFixed(1)} kg`;

    moveMarker(bf);
    updateDonut(bf);
    updateSilhouette(cat);
  } catch (err) {
    alert(err.message);
  }
}
function shakeForm() {
  const card = document.querySelector('.form-card');
  card.classList.remove('shake');
  void card.offsetWidth; // reflow
  card.classList.add('shake');
}

const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
  .shake { animation: shake 0.4s ease; }
`;
document.head.appendChild(style);

gender.addEventListener('change', toggleHip);
calcBtn.addEventListener('click', calculate);
form.addEventListener('reset', () => setTimeout(() => { toggleHip(); resetDisplay(); }, 0));

form.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });

toggleHip();
resetDisplay();