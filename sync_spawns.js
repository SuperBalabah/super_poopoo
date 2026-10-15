/**
 * Live Spawns Sync Script
 * Fetches real live data from coordinates-api.pokemongopro.com
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function apiSearch(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = https.request({
      hostname: 'coordinates-api.pokemongopro.com',
      path: '/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': 'https://pogocoordinates.com',
        'Referer': 'https://pogocoordinates.com/'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ results: [] });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function apiReveal(code) {
  return new Promise((resolve) => {
    https.get('https://coordinates-api.pokemongopro.com/reveal/' + encodeURIComponent(code), {
      headers: {
        'Origin': 'https://pogocoordinates.com',
        'Referer': 'https://pogocoordinates.com/'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  console.log('[Sync] Fetching real live Pokémon GO spawns...');
  
  // 1. Fetch 100IV
  const res100 = await apiSearch({ iv_percent_min: 100, sort: 'DSP' });
  // 2. Fetch 90%+ IV
  const res90 = await apiSearch({ iv_percent_min: 90, sort: 'DSP' });
  // 3. Fetch popular Pokemon (Charmander, Bulbasaur, Squirtle, Pikachu, Dratini, Larvitar, Bagon, Beldum, Gible)
  const resPop = await apiSearch({ pokemon_ids: [1, 4, 7, 25, 129, 147, 149, 246, 371, 374, 443], sort: 'DSP' });

  const map = new Map();
  [...(res100.results || []), ...(res90.results || []), ...(resPop.results || [])].forEach(s => {
    if (!map.has(s.encounter_id)) {
      map.set(s.encounter_id, s);
    }
  });

  const allSpawns = Array.from(map.values());
  console.log(`[Sync] Total unique real live spawns fetched: ${allSpawns.length}`);

  // Reveal top spawns coordinates
  for (let i = 0; i < Math.min(5, allSpawns.length); i++) {
    const s = allSpawns[i];
    if (s.reveal_code && !s.coords) {
      console.log(`[Sync] Revealing coordinates for ${s.pokemon_name} (IV: ${s.iv_percent}%)...`);
      const r = await apiReveal(s.reveal_code);
      if (r && r.coords) {
        s.coords = r.coords;
        s.lat = r.lat;
        s.lng = r.lng;
        console.log(`  -> Revealed: ${r.coords}`);
      }
      // slight delay to prevent rate limit
      await new Promise(r => setTimeout(r, 600));
    }
  }

  const outDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const finalOutput = {
    updated_at: new Date().toISOString(),
    count: allSpawns.length,
    spawns: allSpawns
  };

  fs.writeFileSync(path.join(outDir, 'live_spawns.json'), JSON.stringify(finalOutput, null, 2));
  console.log(`[Sync] Successfully saved to ${path.join(outDir, 'live_spawns.json')}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { apiSearch, apiReveal };
