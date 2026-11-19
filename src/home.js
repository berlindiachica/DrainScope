import { loadData, initLayout, countCondition, showError } from './common.js';

initLayout();

async function showDashboard() {
  try {
    const data = await loadData();
    const lines = data.drainase.features;

    document.querySelector('#count-drainase').textContent = lines.length;
    document.querySelector('#count-genangan').textContent = data.genangan.features.length;
    document.querySelector('#count-wilayah').textContent = data.wilayah.features.length;
    document.querySelector('#donut-total').textContent = lines.length;

    // Persentase warna donut: hijau = baik, oranye = sedang, merah = buruk.
    if (lines.length > 0) {
      const good = (countCondition(lines, 'Baik') / lines.length) * 100;
      const medium = (countCondition(lines, 'Sedang') / lines.length) * 100;
      const bad = (countCondition(lines, 'Buruk') / lines.length) * 100;
      document.querySelector('#condition-donut').style.background =
        `conic-gradient(#21ab91 0% ${good}%, #ffbf6b ${good}% ${good + medium}%, #ea7777 ${good + medium}% ${good + medium + bad}%, #e6edf1 ${good + medium + bad}% 100%)`;
    } else {
      document.querySelector('#condition-donut').style.background = '#e6edf1';
    }
  } catch (error) {
    showError(error.message);
  }
}

showDashboard();
