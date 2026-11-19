import 'ol/ol.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import OSM from 'ol/source/OSM.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat } from 'ol/proj.js';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style.js';
import { buffer } from '@turf/buffer';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { loadData, initLayout, showError } from './common.js';

initLayout();

const format = new GeoJSON();
const radiusSelect = document.querySelector('#radius');
const rankingList = document.querySelector('#ranking-list');
const runButton = document.querySelector('#run-analysis');

function featuresFromGeoJSON(geojson) {
  return format.readFeatures(geojson, { featureProjection: 'EPSG:3857' });
}

async function initAnalysis() {
  try {
    const data = await loadData();
    const badLines = data.drainase.features.filter(feature => feature.properties?.kondisi === 'Buruk');
    const allPoints = data.genangan.features;
    const areas = data.wilayah.features;

    const bufferSource = new VectorSource();
    const badLineLayer = new VectorLayer({ source: new VectorSource({ features: featuresFromGeoJSON({ type: 'FeatureCollection', features: badLines }) }), style: new Style({ stroke: new Stroke({ color: '#dc656c', width: 5 }) }) });
    const pointSource = new VectorSource({ features: featuresFromGeoJSON(data.genangan) });
    const pointLayer = new VectorLayer({ source: pointSource, style: new Style({ image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#157fb2' }), stroke: new Stroke({ color: 'white', width: 2 }) }) }) });
    const bufferLayer = new VectorLayer({ source: bufferSource, style: new Style({ fill: new Fill({ color: 'rgba(231, 107, 115, 0.23)' }), stroke: new Stroke({ color: 'rgba(203, 77, 88, 0.85)', width: 1.5 }) }) });
    const areaLayer = new VectorLayer({ source: new VectorSource({ features: featuresFromGeoJSON(data.wilayah) }), style: new Style({ fill: new Fill({ color: 'rgba(94, 131, 200, 0.06)' }), stroke: new Stroke({ color: '#9c88c4', width: 1.2, lineDash: [6, 5] }) }) });
    const map = new Map({ target: 'analysis-map', layers: [new TileLayer({ source: new OSM() }), areaLayer, bufferLayer, badLineLayer, pointLayer], view: new View({ center: fromLonLat([101.455, 0.52]), zoom: 12 }) });
    map.getView().fit(areaLayer.getSource().getExtent(), { padding: [30, 30, 30, 30], maxZoom: 15 });

    function calculate() {
      const meters = Number(radiusSelect.value);
      document.querySelector('#radius-caption').textContent = meters;

      // 1. Membuat polygon buffer dari masing-masing saluran buruk.
      const buffers = badLines.map(line => buffer(line, meters, { units: 'meters', steps: 16 })).filter(Boolean);
      bufferSource.clear();
      buffers.forEach(shape => bufferSource.addFeatures(featuresFromGeoJSON(shape)));

      // 2. Titik dihitung sekali walaupun masuk lebih dari satu buffer.
      const affected = allPoints.filter(point => buffers.some(shape => booleanPointInPolygon(point, shape)));

      // 3. Kelompokkan titik teridentifikasi berdasarkan polygon wilayah.
      const results = areas.map(area => ({
        name: area.properties?.nama ?? 'Wilayah tidak bernama',
        count: affected.filter(point => booleanPointInPolygon(point, area)).length,
      })).sort((a, b) => b.count - a.count);

      document.querySelector('#bad-drains').textContent = badLines.length;
      document.querySelector('#affected-points').textContent = affected.length;
      document.querySelector('#affected-areas').textContent = results.filter(item => item.count > 0).length;

      rankingList.replaceChildren();
      results.forEach((result, index) => {
        const row = document.createElement('div'); row.className = 'ranking-item';
        const number = document.createElement('span'); number.className = 'rank-number'; number.textContent = String(index + 1).padStart(2, '0');
        const content = document.createElement('div'); content.className = 'rank-content';
        const name = document.createElement('strong'); name.textContent = result.name;
        const desc = document.createElement('p'); desc.textContent = result.count > 0 ? 'Ada titik genangan dekat saluran buruk' : 'Tidak ditemukan titik pada buffer';
        content.append(name, desc);
        const count = document.createElement('span'); count.className = 'rank-count'; count.textContent = result.count;
        const small = document.createElement('small'); small.textContent = 'titik'; count.append(small);
        row.append(number, content, count); rankingList.append(row);
      });
      if (results.length === 0) rankingList.textContent = 'Tidak ada wilayah untuk dianalisis.';
    }
    runButton.addEventListener('click', calculate);
    calculate();
  } catch (error) {
    rankingList.textContent = 'Tidak dapat memproses data.';
    showError(error.message);
  }
}

initAnalysis();
