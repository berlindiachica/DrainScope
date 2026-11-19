import 'ol/ol.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Overlay from 'ol/Overlay.js';
import { fromLonLat } from 'ol/proj.js';
import { Fill, Stroke, Style, Circle as CircleStyle } from 'ol/style.js';
import { loadData, initLayout, showError } from './common.js';

initLayout();

// Catatan: atribut kondisi harus bernama: Baik / Sedang / Buruk.
const conditionColors = { Baik: '#21ad8d', Sedang: '#f0a547', Buruk: '#e76c70' };
const filter = document.querySelector('#condition-filter');
const lineToggle = document.querySelector('#toggle-line');
const pointToggle = document.querySelector('#toggle-point');
const polygonToggle = document.querySelector('#toggle-polygon');
const popupElement = document.querySelector('#popup');
const popupType = document.querySelector('#popup-type');
const popupName = document.querySelector('#popup-name');
const popupDetail = document.querySelector('#popup-detail');

function toFeatures(collection) {
  return new GeoJSON().readFeatures(collection, { featureProjection: 'EPSG:3857' });
}

function makeStyle(color, width = 4) {
  return new Style({ stroke: new Stroke({ color, width, lineCap: 'round' }) });
}

async function createMap() {
  try {
    const data = await loadData();
    const polygonSource = new VectorSource({ features: toFeatures(data.wilayah) });
    const lineSource = new VectorSource({ features: toFeatures(data.drainase) });
    const pointSource = new VectorSource({ features: toFeatures(data.genangan) });

    const polygonLayer = new VectorLayer({
      source: polygonSource,
      style: new Style({ fill: new Fill({ color: 'rgba(117, 105, 191, 0.07)' }), stroke: new Stroke({ color: '#917dc5', width: 1.5, lineDash: [7, 5] }) }),
    });

    const lineLayer = new VectorLayer({
      source: lineSource,
      style: feature => {
        const condition = feature.get('kondisi');
        if (filter.value !== 'Semua' && condition !== filter.value) return null;
        return makeStyle(conditionColors[condition] ?? '#8297a0', 5);
      },
    });

    const pointLayer = new VectorLayer({
      source: pointSource,
      style: feature => {
        const height = Number(feature.get('tinggi_cm')) || 0;
        const radius = 6 + Math.min(height / 15, 6);
        return new Style({ image: new CircleStyle({ radius, fill: new Fill({ color: '#138ac1' }), stroke: new Stroke({ color: 'white', width: 2.5 }) }) });
      },
    });

    const map = new Map({
      target: 'map',
      layers: [new TileLayer({ source: new OSM() }), polygonLayer, lineLayer, pointLayer],
      view: new View({ center: fromLonLat([101.455, 0.52]), zoom: 12 }),
    });

    // Memusatkan peta sesuai cakupan polygon yang tersedia.
    if (polygonSource.getFeatures().length) {
      map.getView().fit(polygonSource.getExtent(), { padding: [35, 35, 35, 35], maxZoom: 15 });
    }

    const popup = new Overlay({ element: popupElement, positioning: 'bottom-center', stopEvent: true, offset: [0, -10], autoPan: { animation: { duration: 200 } } });
    map.addOverlay(popup);
    const hidePopup = () => { popup.setPosition(undefined); popupElement.hidden = true; };
    document.querySelector('#popup-close').addEventListener('click', hidePopup);

    map.on('singleclick', event => {
      const feature = map.forEachFeatureAtPixel(event.pixel, found => found, { hitTolerance: 6 });
      if (!feature) { hidePopup(); return; }
      const attrs = feature.getProperties();
      const geoType = feature.getGeometry().getType();
      popupType.textContent = geoType === 'Point' ? 'TITIK GENANGAN' : geoType === 'LineString' ? 'JARINGAN DRAINASE' : 'BATAS WILAYAH';
      popupName.textContent = attrs.nama || attrs.id || 'Objek spasial';
      popupDetail.replaceChildren();
      const details = geoType === 'Point'
        ? [['ID', attrs.id], ['Kategori', attrs.kategori], ['Tinggi genangan', `${attrs.tinggi_cm ?? '—'} cm`]]
        : geoType === 'LineString'
          ? [['ID', attrs.id], ['Kondisi', attrs.kondisi], ['Masalah', attrs.masalah]]
          : [['ID', attrs.id], ['Jenis', attrs.jenis]];
      details.forEach(([label, value]) => {
        const row = document.createElement('div');
        row.textContent = `${label}: ${value ?? '—'}`;
        popupDetail.append(row);
      });
      popupElement.hidden = false;
      popup.setPosition(event.coordinate);
    });

    const updateCount = () => {
      const count = data.drainase.features.filter(feature => filter.value === 'Semua' || feature.properties.kondisi === filter.value).length;
      document.querySelector('#visible-lines').textContent = lineToggle.checked ? count : 0;
    };
    filter.addEventListener('change', () => { lineLayer.changed(); updateCount(); hidePopup(); });
    lineToggle.addEventListener('change', () => { lineLayer.setVisible(lineToggle.checked); updateCount(); hidePopup(); });
    pointToggle.addEventListener('change', () => { pointLayer.setVisible(pointToggle.checked); hidePopup(); });
    polygonToggle.addEventListener('change', () => { polygonLayer.setVisible(polygonToggle.checked); hidePopup(); });
    document.querySelector('#reset-map').addEventListener('click', () => {
      filter.value = 'Semua';
      lineToggle.checked = pointToggle.checked = polygonToggle.checked = true;
      lineLayer.setVisible(true); pointLayer.setVisible(true); polygonLayer.setVisible(true);
      lineLayer.changed(); updateCount(); hidePopup();
      if (polygonSource.getFeatures().length) map.getView().fit(polygonSource.getExtent(), { padding: [35, 35, 35, 35], maxZoom: 15, duration: 250 });
    });
    updateCount();
    document.querySelector('#map-status').textContent = '3 layer siap';
  } catch (error) {
    document.querySelector('#map-status').textContent = 'Data gagal dimuat';
    showError(error.message);
  }
}

createMap();
