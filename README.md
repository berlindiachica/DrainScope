# DrainScope — Starter Project Sistem Informasi Geografis

**Tema:** Kondisi Drainase dan Potensi Banjir  
**Teknologi:** HTML, CSS, JavaScript, Vite, OpenLayers, Turf.js  
**Halaman awal:** `index.html` (Home, **tanpa peta**). Peta ada di `peta.html`.

> PENTING: Semua GeoJSON yang ada di folder `public/data/` adalah **DATA SIMULASI** untuk mendemonstrasikan web, **BUKAN** hasil survei ataupun data kejadian banjir sebenarnya. Jangan menggunakannya sebagai temuan penelitian.

## 1. Persiapan di VS Code

- Instal Node.js (disarankan versi LTS terbaru).
- Ekstrak ZIP ini, lalu buka folder `drainscope-sig` melalui **File > Open Folder** di Visual Studio Code.
- Buka terminal VS Code: **Terminal > New Terminal**.
- Pastikan perintah `node -v` dan `npm -v` menampilkan versi.

## 2. Instal dan jalankan

```bash
npm install
npm run dev
```

Buka URL `Local` yang muncul (biasanya `http://localhost:5173/`).
Jangan menggunakan `file:///.../index.html` atau hanya membuka HTML dengan double click. Gunakan server Vite karena data dibaca dengan `fetch()` dan dependensi OpenLayers diimpor lewat NPM.

## 3. Struktur folder

```text
drainscope-sig/
├── index.html                 # Home, halaman PERTAMA yang terbuka
├── peta.html                  # Peta interaktif + checkbox dan list box
├── analisis.html              # Buffer analysis dan ringkasan hasil
├── src/
│   ├── style.css              # Semua desain website (responsive)
│   ├── common.js              # Fetch GeoJSON dan navbar
│   ├── home.js                # Statistik dashboard Home
│   ├── map.js                 # OpenLayers: 3 layer, popup, filter
│   └── analysis.js            # Buffer + spatial query + tabel prioritas
├── public/
│   ├── assets/
│   │   ├── mark.svg
│   │   └── watershed.svg
│   └── data/
│       ├── drainase.geojson
│       ├── titik_genangan.geojson
│       └── wilayah.geojson
├── package.json
└── vite.config.js
```

## 4. Cara mengganti data contoh dengan data survei asli

1. Dari ArcMap/QGIS, eksport **point**, **line**, dan **polygon** masing-masing menjadi **GeoJSON** dengan sistem koordinat **EPSG:4326 (WGS 84)**.
2. Pastikan seluruh GeoJSON adalah `FeatureCollection` dan koordinat berupa `[longitude, latitude]`.
3. Nama dan lokasi file yang diperlukan di folder `public/data/`:
   - `drainase.geojson` untuk **LineString / MultiLineString** (contoh pakai LineString)
   - `titik_genangan.geojson` untuk **Point**
   - `wilayah.geojson` untuk **Polygon / MultiPolygon**
4. Pastikan kolom atribut disesuaikan dengan format berikut. Jika nama kolom berbeda, ganti pemanggilan `feature.get('...')` di `src/map.js` dan `feature.properties...` di `src/analysis.js`:

| Layer | Kolom wajib untuk fitur demo | Contoh |
|---|---|---|
| Drainase (line) | `id`, `nama`, `kondisi`, `masalah` | `D001`, `Drainase A`, `Buruk`, `Tersumbat` |
| Genangan (point) | `id`, `nama`, `kategori`, `tinggi_cm` | `B001`, `Titik B`, `Sedang`, `25` |
| Wilayah (polygon) | `id`, `nama`, `jenis` | `W001`, `Kelurahan A`, `Kelurahan` |

`kondisi` harus berupa `Baik`, `Sedang`, atau `Buruk`. Jika kategori survei berbeda, sesuaikan logika dan daftar pilihan di `peta.html`.

5. Ubah **tulisan “DATA SIMULASI” menjadi “DATA SURVEI”** hanya setelah seluruh data simulasi telah diganti dengan data lapangan yang sebenarnya dan diperiksa. Jika jumlah/kategori berbeda, statistik di Home mengikuti file GeoJSON otomatis.
6. Ganti nama project/branding `DrainScope` sesuai kebutuhan.

## 5. Analisis spasial

Pada halaman **Analisis Spasial**:
- Filter line: `kondisi === 'Buruk'`.
- Buat buffer 50 / 100 / 200 / 300 meter menggunakan Turf.js.
- Cari point yang masuk ke minimal salah satu buffer (tidak dihitung ganda).
- Kelompokkan point yang masuk buffer berdasarkan polygon wilayah.
- Urutkan jumlah point per wilayah untuk **indikasi prioritas pemeriksaan**.

Metode ini **tidak menghitung tingkat potensi/risiko banjir komprehensif**. Untuk menyatakan “potensi banjir tinggi/sedang/rendah” perlu basis metodologis serta data relevan (misalnya elevasi, kemiringan, curah hujan, riwayat, kapasitas drainase). Nilai radius buffer contoh bukan standar teknis atau hasil kalibrasi.

## 6. Persiapan presentasi

Uji checklist:
- `http://localhost:5173/` harus langsung membuka **Home**.
- Tautan **Peta Interaktif** harus menampilkan 3 layer; coba checkbox dan filter kondisi.
- Klik titik dan garis untuk memeriksa popup.
- Buka **Analisis Spasial**, ubah radius ke 50m lalu 200m, klik *Jalankan analisis* untuk membandingkan hasil.
- Ganti ke data survei asli dan validasi hasil buffer/overlay dengan ArcGIS/QGIS.
- Ambil screenshot Home, peta, filter, analisis dan tabel pengujian untuk Bab IV.

## 7. Build produksi (opsional)

```bash
npm run build
npm run preview
```

Folder `dist/` akan berisi `index.html`, `peta.html`, dan `analisis.html`. Bila website di-deploy di sub-folder/domain khusus, sesuaikan `base` pada Vite dan URL absolut sesuai kebutuhan.

## 8. Jika terjadi error

- `npm not recognized`: Node.js belum terinstal atau terminal perlu dibuka ulang.
- `Cannot find package 'ol'`: jalankan `npm install` di folder yang berisi `package.json`.
- GeoJSON 404: cek file di `public/data` dan nama sesuai dengan `src/common.js`.
- GeoJSON tidak terlihat: cek tipe geometri, EPSG:4326, atribut dan validitas GeoJSON. Di `src/map.js`, peta otomatis difokuskan ke cakupan polygon.
- Map dasar kosong: perlu internet agar tile OpenStreetMap dapat dimuat.

**Lisensi/sumber:** OpenLayers (https://openlayers.org/); Turf.js (https://turfjs.org/); basemap © OpenStreetMap contributors. Ilustrasi dan logo adalah SVG sederhana yang dibuat khusus untuk demo.
