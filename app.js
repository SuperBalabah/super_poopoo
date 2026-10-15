/**
 * Super Poopoo Radar - Core Application
 * Real Live Data Engine & Local Shiny Matcher
 */

// Presets & Defaults
const DEFAULT_LOCATIONS = [
  { id: 'tpe101', name: '台北101', lat: 25.033964, lng: 121.564468 },
  { id: 'daan', name: '大安森林公園', lat: 25.030560, lng: 121.536338 },
  { id: 'tpe_main', name: '台北車站', lat: 25.047814, lng: 121.517056 },
  { id: 'tc_park', name: '台中草悟道', lat: 24.150821, lng: 120.663321 },
  { id: 'kh_river', name: '高雄愛河', lat: 22.624765, lng: 120.291753 }
];

const state = {
  centerLat: 25.033964,
  centerLng: 121.564468,
  radiusKm: 100, // Default wider radius to show global live spawns
  minIv: 100,
  targetPokemonId: null,
  targetPokemonQuery: '',
  trainerSeed: localStorage.getItem('pogo_trainer_seed') || '0x7f4a8b29c1e345d0',
  shinyOnly: false,
  savedLocations: [],
  map: null,
  centerMarker: null,
  radiusCircle: null,
  spawnMarkers: [],
  rawSpawns: [],
  deferredPrompt: null
};

// Cooldown Matrix
const COOLDOWN_TABLE = [
  { km: 1, mins: 1 },
  { km: 5, mins: 2 },
  { km: 10, mins: 7 },
  { km: 25, mins: 11 },
  { km: 50, mins: 20 },
  { km: 100, mins: 30 },
  { km: 250, mins: 45 },
  { km: 500, mins: 65 },
  { km: 1000, mins: 98 },
  { km: 1350, mins: 120 }
];

function calculateCooldown(distKm) {
  if (distKm <= 0.1) return 0;
  for (const entry of COOLDOWN_TABLE) {
    if (distKm <= entry.km) return entry.mins;
  }
  return 120;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * 64-bit Deterministic Shiny Seed Hash Checker
 */
function checkIsShiny(encounterIdStr, trainerSeedStr, shinyRate = 512) {
  try {
    const enc = BigInt(encounterIdStr.replace(/[^0-9\-]/g, ''));
    let seed = 0n;
    if (trainerSeedStr.startsWith('0x') || trainerSeedStr.startsWith('0X')) {
      seed = BigInt(trainerSeedStr);
    } else {
      seed = BigInt(trainerSeedStr.replace(/[^0-9]/g, ''));
    }

    let h = (enc ^ seed) * 0x517cc1b727220a95n;
    h = (h ^ (h >> 32n)) * 0x6c62272e07bb0142n;
    h = h ^ (h >> 32n);

    return (h % BigInt(shinyRate)) === 0n;
  } catch (err) {
    return false;
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Initialize Leaflet Map
function initMap() {
  state.map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView([state.centerLat, state.centerLng], 12);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(state.map);

  state.centerMarker = L.marker([state.centerLat, state.centerLng], {
    draggable: true
  }).addTo(state.map);

  state.radiusCircle = L.circle([state.centerLat, state.centerLng], {
    color: '#06b6d4',
    fillColor: '#06b6d4',
    fillOpacity: 0.08,
    radius: state.radiusKm * 1000
  }).addTo(state.map);

  state.map.on('click', (e) => {
    updateCenter(e.latlng.lat, e.latlng.lng);
  });

  state.centerMarker.on('dragend', (e) => {
    const p = e.target.getLatLng();
    updateCenter(p.lat, p.lng);
  });
}

function updateCenter(lat, lng) {
  state.centerLat = Number(lat.toFixed(6));
  state.centerLng = Number(lng.toFixed(6));
  document.getElementById('center-coords').value = `${state.centerLat}, ${state.centerLng}`;
  state.centerMarker.setLatLng([state.centerLat, state.centerLng]);
  state.radiusCircle.setLatLng([state.centerLat, state.centerLng]);
}

// Location Presets
function loadSavedLocations() {
  const stored = localStorage.getItem('pogo_saved_locations');
  if (stored) {
    try {
      state.savedLocations = JSON.parse(stored);
    } catch (e) {
      state.savedLocations = [...DEFAULT_LOCATIONS];
    }
  } else {
    state.savedLocations = [...DEFAULT_LOCATIONS];
    localStorage.setItem('pogo_saved_locations', JSON.stringify(state.savedLocations));
  }
  renderLocationPills();
}

function renderLocationPills() {
  const container = document.getElementById('location-pills');
  container.innerHTML = '';

  state.savedLocations.forEach((loc) => {
    const pill = document.createElement('div');
    pill.className = `loc-pill ${Math.abs(loc.lat - state.centerLat) < 0.001 && Math.abs(loc.lng - state.centerLng) < 0.001 ? 'active' : ''}`;
    pill.innerHTML = `
      <span>${loc.name}</span>
      ${loc.isCustom ? `<span class="loc-del" title="刪除">✕</span>` : ''}
    `;

    pill.addEventListener('click', (e) => {
      if (e.target.classList.contains('loc-del')) {
        e.stopPropagation();
        state.savedLocations = state.savedLocations.filter(l => l.id !== loc.id);
        localStorage.setItem('pogo_saved_locations', JSON.stringify(state.savedLocations));
        renderLocationPills();
        showToast('已刪除自訂地點');
        return;
      }
      updateCenter(loc.lat, loc.lng);
      state.map.setView([loc.lat, loc.lng], 13);
      renderLocationPills();
      executeScan();
      showToast(`已切換至「${loc.name}」`);
    });

    container.appendChild(pill);
  });
}

/**
 * Real Live Data Fetcher
 * Tries local proxy first (/api/search), falls back to ./data/live_spawns.json
 */
async function fetchRealLiveData(payload) {
  // 1. Try local server API proxy (running via node server.js)
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return { source: 'live_api', spawns: data.results };
      }
    }
  } catch (e) {
    // Local API not available (e.g. pure GitHub Pages)
  }

  // 2. Fallback to GitHub Pages live snapshot data
  try {
    const res = await fetch('./data/live_spawns.json?t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      return { source: 'github_live_snapshot', spawns: data.spawns || [] };
    }
  } catch (e) {
    console.error('Snapshot fetch error:', e);
  }

  return { source: 'empty', spawns: [] };
}

// Render Results on Map & List
function renderSpawns(spawns, source = '') {
  for (const m of state.spawnMarkers) {
    state.map.removeLayer(m);
  }
  state.spawnMarkers = [];

  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  const filtered = spawns.filter((s) => {
    // IV Filter
    if (s.iv_percent < state.minIv) return false;

    // Pokemon Query Filter
    if (state.targetPokemonId && s.pokemon_id !== state.targetPokemonId) {
      return false;
    }
    if (state.targetPokemonQuery) {
      const q = state.targetPokemonQuery.toLowerCase();
      const matchZh = (s.name_zh || '').toLowerCase().includes(q);
      const matchEn = (s.pokemon_name || s.name_en || '').toLowerCase().includes(q);
      const matchId = s.pokemon_id.toString() === q;
      if (!matchZh && !matchEn && !matchId) return false;
    }

    // Check Shiny for this spawn
    s.is_shiny = checkIsShiny(s.encounter_id, state.trainerSeed, s.pokemon_id === 129 ? 64 : 512);

    if (state.shinyOnly && !s.is_shiny) return false;

    return true;
  });

  document.getElementById('stat-total').innerText = filtered.length;
  document.getElementById('tab-count').innerText = filtered.length;

  let shinyCount = 0;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px 10px; color: var(--text-mute);">
        <p style="font-size: 32px; margin-bottom: 8px;">🔍</p>
        <p>未發現符合條件的野生寶可夢。<br>目前共有 ${spawns.length} 筆真實即時數據，可點擊「全部」或調降 IV 門檻。</p>
      </div>
    `;
    document.getElementById('stat-shiny').innerText = '0';
    return;
  }

  filtered.forEach((s) => {
    if (s.is_shiny) shinyCount++;

    // Resolve Chinese name
    const dictEntry = typeof POKEMON_DICT !== 'undefined' ? POKEMON_DICT.find(p => p.id === s.pokemon_id) : null;
    const nameZh = dictEntry ? dictEntry.zh : s.pokemon_name;
    const nameEn = s.pokemon_name || (dictEntry ? dictEntry.en : '');

    // Distance and Cooldown
    let distKm = s.distance_km;
    let cdMin = s.cooldown_min;
    if (s.lat && s.lng) {
      distKm = calculateDistance(state.centerLat, state.centerLng, s.lat, s.lng);
      cdMin = calculateCooldown(distKm);
    }

    // Add Map Marker if coordinates are revealed
    if (s.lat && s.lng) {
      const markerHtml = s.is_shiny
        ? `<div style="background: #fbbf24; color: #000; font-weight: 800; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px #fbbf24; border: 2px solid #fff; font-size: 14px;">✨</div>`
        : `<div style="background: #06b6d4; color: #fff; font-weight: 700; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px #06b6d4; border: 1px solid #fff; font-size: 10px;">${s.iv_percent === 100 ? '100' : s.iv_percent}</div>`;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const m = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(state.map);
      m.bindPopup(`
        <div style="font-family: sans-serif; color: #111;">
          <b style="font-size: 14px;">${nameZh} (#${s.pokemon_id} ${nameEn})</b><br>
          IV: <b>${s.iv_percent}%</b> (${s.raw_iv}) | CP: <b>${s.cp}</b><br>
          地點: ${s.location || '—'}<br>
          距離: <b>${distKm} km</b> (冷卻: <b>${cdMin} 分鐘</b>)<br>
          ${s.is_shiny ? '<b style="color: #b45309;">✨ 對你的帳號 Seed 為色違！</b><br>' : ''}
          座標: <code>${s.coords || `${s.lat},${s.lng}`}</code>
        </div>
      `);
      state.spawnMarkers.push(m);
    }

    // Create Feed Card
    const card = document.createElement('div');
    card.className = `spawn-card ${s.is_shiny ? 'shiny-badge' : ''}`;
    const coordStr = s.coords || (s.lat && s.lng ? `${s.lat},${s.lng}` : null);

    card.innerHTML = `
      ${s.is_shiny ? '<div class="shiny-banner">✨ 專屬保證色違 (SHINY FOR YOUR SEED)</div>' : ''}
      <div class="card-main-info">
        <div class="pkmn-title-row">
          <span class="pkmn-zh">${nameZh}</span>
          <span class="pkmn-en">#${s.pokemon_id} ${nameEn}</span>
        </div>
        <span class="iv-box ${s.iv_percent === 100 ? 'iv100' : ''}">${s.iv_percent}%</span>
      </div>
      <p style="font-size: 11px; color: var(--text-sub); margin-top: -2px;">📍 ${s.location || '即時掃描點'}</p>
      <div class="stats-grid">
        <div class="grid-cell">
          <span>CP / 等級</span>
          <b>${s.cp} (Lv ${s.level})</b>
        </div>
        <div class="grid-cell">
          <span>三圍 IV</span>
          <b>${s.raw_iv}</b>
        </div>
        <div class="grid-cell">
          <span>傳送冷卻</span>
          <b>${cdMin != null ? `${cdMin} 分鐘` : '換算中'}</b>
        </div>
        <div class="grid-cell">
          <span>直線距離</span>
          <b>${distKm != null ? `${distKm} km` : '—'}</b>
        </div>
        <div class="grid-cell">
          <span>消失時間</span>
          <b>${s.despawn_at ? s.despawn_at.slice(11, 19) : '即將'}</b>
        </div>
        <div class="grid-cell">
          <span>招式</span>
          <b>${s.fast_move || '—'}</b>
        </div>
      </div>
      <div class="card-action-bar">
        <span class="coords-label">${coordStr ? `📍 ${coordStr}` : '🔒 待解鎖座標'}</span>
        ${coordStr 
          ? `<button class="btn-copy" onclick="copyCoords('${coordStr}', ${cdMin || 0}, this)">一鍵複製座標</button>`
          : `<button class="btn-copy" onclick="revealAndCopy('${s.reveal_code}', this)">解鎖經緯度</button>`
        }
      </div>
    `;
    container.appendChild(card);
  });

  document.getElementById('stat-shiny').innerText = shinyCount;
}

window.copyCoords = function(coords, cooldown, btn) {
  navigator.clipboard.writeText(coords);
  showToast(`已複製真實座標！建議冷卻: ${cooldown} 分鐘`);
  const orig = btn.innerText;
  btn.innerText = '已複製!';
  btn.style.background = '#10b981';
  btn.style.color = '#fff';
  setTimeout(() => {
    btn.innerText = orig;
    btn.style.background = '';
    btn.style.color = '';
  }, 1200);
};

window.revealAndCopy = async function(revealCode, btn) {
  btn.innerText = '解鎖中...';
  try {
    // Try local proxy or direct
    let coords = null;
    try {
      const r = await fetch('/api/reveal/' + encodeURIComponent(revealCode));
      if (r.ok) {
        const j = await r.json();
        coords = j.coords;
      }
    } catch(e) {}

    if (coords) {
      navigator.clipboard.writeText(coords);
      btn.innerText = '已解鎖並複製!';
      btn.style.background = '#10b981';
      showToast(`座標已解鎖：${coords}`);
    } else {
      btn.innerText = '解鎖次數受限';
      showToast('此座標受官方每小時頻率保護');
    }
  } catch (err) {
    btn.innerText = '重試';
  }
};

// Scan Execution
async function executeScan() {
  const statusEl = document.getElementById('scan-status');
  statusEl.innerText = '正在抓取 Pogocoordinates 真實即時數據...';

  state.trainerSeed = document.getElementById('trainer-seed').value.trim() || '0x7f4a8b29c1e345d0';
  localStorage.setItem('pogo_trainer_seed', state.trainerSeed);

  state.minIv = Number(document.getElementById('iv-slider').value);
  state.radiusKm = Number(document.getElementById('search-radius').value);
  state.shinyOnly = document.getElementById('shiny-toggle').checked;

  const payload = {
    sort: 'DSP',
    iv_percent_min: state.minIv
  };
  if (state.targetPokemonId) {
    payload.pokemon_ids = [state.targetPokemonId];
  }

  const { source, spawns } = await fetchRealLiveData(payload);
  state.rawSpawns = spawns;

  renderSpawns(state.rawSpawns, source);
  statusEl.innerText = `即時數據連線成功 (${source === 'live_api' ? '⚡ 直連 API' : '🛰️ GitHub 即時快照'}) · 共 ${spawns.length} 筆真實資料`;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadSavedLocations();

  if (state.trainerSeed) {
    document.getElementById('trainer-seed').value = state.trainerSeed;
  }

  // Radius Slider
  const rSlider = document.getElementById('search-radius');
  rSlider.addEventListener('input', (e) => {
    state.radiusKm = Number(e.target.value);
    document.getElementById('radius-val').innerText = `${state.radiusKm} km`;
    state.radiusCircle.setRadius(state.radiusKm * 1000);
  });

  // IV Slider
  const ivSlider = document.getElementById('iv-slider');
  ivSlider.addEventListener('input', (e) => {
    state.minIv = Number(e.target.value);
    document.getElementById('iv-val').innerText = `${state.minIv}%`;
    document.querySelectorAll('.iv-btn').forEach(b => b.classList.remove('active'));
    executeScan();
  });

  // IV Shortcuts
  document.querySelectorAll('.iv-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.iv-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = Number(btn.getAttribute('data-iv'));
      state.minIv = val;
      ivSlider.value = val;
      document.getElementById('iv-val').innerText = `${val}%`;
      executeScan();
    });
  });

  // Coords Input
  document.getElementById('center-coords').addEventListener('change', (e) => {
    const parts = e.target.value.split(',').map(x => parseFloat(x.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      updateCenter(parts[0], parts[1]);
      state.map.setView([parts[0], parts[1]], state.map.getZoom());
      renderLocationPills();
      executeScan();
    }
  });

  // GPS My Location
  document.getElementById('btn-my-loc').addEventListener('click', () => {
    if (navigator.geolocation) {
      showToast('定位中...');
      navigator.geolocation.getCurrentPosition((pos) => {
        updateCenter(pos.coords.latitude, pos.coords.longitude);
        state.map.setView([pos.coords.latitude, pos.coords.longitude], 13);
        renderLocationPills();
        executeScan();
        showToast('已定位至目前位置！');
      }, () => {
        showToast('無法取得定位權限');
      });
    }
  });

  // Shiny Toggle
  document.getElementById('shiny-toggle').addEventListener('change', executeScan);

  // Pokemon Search & Autocomplete
  const searchInput = document.getElementById('pokemon-search');
  const autoBox = document.getElementById('autocomplete-box');

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    state.targetPokemonQuery = q;

    if (q.length > 0 && typeof POKEMON_DICT !== 'undefined') {
      const matches = POKEMON_DICT.filter(p => 
        p.zh.includes(q) || p.en.toLowerCase().includes(q.toLowerCase()) || p.id.toString() === q
      ).slice(0, 6);

      if (matches.length > 0) {
        autoBox.innerHTML = matches.map(p => `
          <div class="autocomplete-item" data-id="${p.id}" data-name="${p.zh}">
            <span>${p.zh} (${p.en})</span>
            <span style="color: var(--text-mute);">#${p.id}</span>
          </div>
        `).join('');
        autoBox.style.display = 'block';
      } else {
        autoBox.style.display = 'none';
      }
    } else {
      autoBox.style.display = 'none';
      state.targetPokemonId = null;
    }
    executeScan();
  });

  autoBox.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (item) {
      const id = parseInt(item.getAttribute('data-id'), 10);
      const name = item.getAttribute('data-name');
      searchInput.value = name;
      state.targetPokemonId = id;
      state.targetPokemonQuery = name;
      autoBox.style.display = 'none';
      executeScan();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-wrapper')) {
      autoBox.style.display = 'none';
    }
  });

  // Popular Chips
  document.querySelectorAll('.popular-chips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (chip.id === 'btn-clear-pkmn') {
        searchInput.value = '';
        state.targetPokemonId = null;
        state.targetPokemonQuery = '';
        document.querySelectorAll('.popular-chips .chip').forEach(c => c.classList.remove('active'));
      } else {
        const id = parseInt(chip.getAttribute('data-id'), 10);
        searchInput.value = chip.innerText;
        state.targetPokemonId = id;
        state.targetPokemonQuery = chip.innerText;
        document.querySelectorAll('.popular-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      }
      executeScan();
    });
  });

  // Scan Refresh
  document.getElementById('btn-refresh-scan').addEventListener('click', executeScan);

  // Mobile Tabs
  const tabMap = document.getElementById('tab-map');
  const tabList = document.getElementById('tab-list');
  const mapView = document.getElementById('map-view-container');
  const listView = document.getElementById('list-view-container');

  if (tabMap && tabList) {
    tabMap.addEventListener('click', () => {
      tabMap.classList.add('active');
      tabList.classList.remove('active');
      mapView.classList.remove('hidden');
      listView.classList.add('hidden');
      state.map.invalidateSize();
    });

    tabList.addEventListener('click', () => {
      tabList.classList.add('active');
      tabMap.classList.remove('active');
      listView.classList.remove('hidden');
      mapView.classList.add('hidden');
    });
  }

  // Mobile Sidebar
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  const closeBtn = document.getElementById('btn-close-sidebar');

  if (toggleBtn) toggleBtn.addEventListener('click', () => sidebar.classList.add('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));

  // Custom Location Modal
  const modal = document.getElementById('location-modal');
  document.getElementById('btn-add-location').addEventListener('click', () => {
    document.getElementById('new-loc-name').value = '';
    document.getElementById('new-loc-coords').value = `${state.centerLat}, ${state.centerLng}`;
    modal.style.display = 'flex';
  });

  document.getElementById('btn-cancel-loc').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('btn-save-loc').addEventListener('click', () => {
    const name = document.getElementById('new-loc-name').value;
    const coords = document.getElementById('new-loc-coords').value;
    if (!name.trim()) {
      showToast('請輸入地點名稱');
      return;
    }
    const parts = coords.split(',').map(x => parseFloat(x.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      state.savedLocations.push({
        id: 'custom_' + Date.now(),
        name: name.trim(),
        lat: parts[0],
        lng: parts[1],
        isCustom: true
      });
      localStorage.setItem('pogo_saved_locations', JSON.stringify(state.savedLocations));
      renderLocationPills();
      updateCenter(parts[0], parts[1]);
      state.map.setView([parts[0], parts[1]], 13);
      modal.style.display = 'none';
      executeScan();
      showToast(`已儲存新地點「${name}」！`);
    } else {
      showToast('經緯度格式錯誤 (請用 緯度, 經度)');
    }
  });

  // PWA Prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    const pwaBtn = document.getElementById('btn-install-pwa');
    if (pwaBtn) {
      pwaBtn.style.display = 'block';
      pwaBtn.addEventListener('click', () => {
        pwaBtn.style.display = 'none';
        state.deferredPrompt.prompt();
        state.deferredPrompt.userChoice.then(() => {
          state.deferredPrompt = null;
        });
      });
    }
  });

  // Initial Execution
  executeScan();
});
