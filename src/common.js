import './style.css';

// Folder public/ otomatis dapat diakses dari alamat /data/... oleh Vite.
const files = {
  drainase: '/data/drainase.geojson',
  genangan: '/data/titik_genangan.geojson',
  wilayah: '/data/wilayah.geojson',
};

// Membaca 3 file GeoJSON sekaligus.
export async function loadData() {
  const entries = await Promise.all(Object.entries(files).map(async ([key, url]) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Gagal mengambil ${url} (HTTP ${response.status})`);
    const data = await response.json();
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error(`${url} harus bertipe GeoJSON FeatureCollection.`);
    }
    return [key, data];
  }));
  return Object.fromEntries(entries);
}

export function initLayout() {
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }
}

export function countCondition(features, target) {
  return features.filter(feature => feature.properties?.kondisi === target).length;
}

export function showError(message) {
  const warning = document.createElement('div');
  warning.className = 'notice-inline';
  warning.style.color = '#a93a45';
  warning.textContent = `⚠ ${message}. Periksa file GeoJSON dan Console (F12).`;
  document.querySelector('main')?.prepend(warning);
  console.error(message);
}
