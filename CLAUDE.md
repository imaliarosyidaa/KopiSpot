@AGENTS.md
# CLAUDE.md - Coffidoor
Sebuah aplikasi web modern yang membantu pengguna menemukan kafe-kafe yang estetik, populer, dan sedang tren. Pengguna dapat menjelajahi kafe untuk belajar, bekerja, nongkrong, atau mengambil foto. Setiap halaman kafe menyertakan informasi detail, menu, ulasan, peringkat, dan konten yang dihasilkan komunitas.

---

## Tech Stack
| Tool          | Version / Notes                               |
|---------------|-----------------------------------------------|
| React         | v18+                                          |
| TypeScript    | Strict Mode                                   |
| Tailwind CSS  | v4.0+ (Menggunakan @custom-variant)           |
| Former Motion | Animasi / Transisi UI                         |
| next-intl     | Lokalisasi / Multi-bahasa (ID/EN)             |
| next-auth     | Autentikasi (Sesi Anggota & Admin)            |
| next-themes   | Manajemen Tema Dasar                          |
| Zustand       | Global State Management (Client-side)         |
| mpm           | Package Manager & Runtime                     |

---

## Comands
- Install Dependencies: npm install
- Development Server: npm dev
- Build Production: npm run build
- Start Production: npm start
- Linting: npm run lint

## Theme System

Five themes: `light`, `dark`,

- Config: Dikonfigurasi via Tailwind CSS v4 configuration (global.css atau tailwind.config.js).
- Types: Diperluas melalui Theme type alias dalam direktori @/types/theme.ts.
- Provider: Menggunakan ThemeProvider dari next-themes yang dibungkus dalam root layout.
- CSS variables: Ditentukan di dalam :root dan selector kelas masing-masing tema di global.css.

### Tilwind variants

```
@custom-variant dark (&:where(.dark, .dark *));

```

Defined with `@custom-variant` in `global.css`.

### Theme-specific primary colors

- light / dark: Blue/Indigo (#2563eb) - Standar profesional pemerintahan.

### Theme icons
| Theme     | Icon                  |
|-----------|-----------------------|
| light     | `MdlightMode`         |
| dark      | `MdDarkMode`          |
|-----------|-----------------------|

## Project Structure

```

Coffidoor/
├── .figma/
├── dist/
├── node_modules
├── server
├── src/
│   ├── lib/
│   ├── components/          # Reusable UI Components
│   │   ├── ui/              # Base primitive components (Button, Input, dll)
│   │   ├── dashboard/       # Dashboard specific charts and tables
│   │   └── shared/          # Navbar, Sidebar, ThemeSwitcher
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── vite-env.d.ts
├── .gitattributes
├── .gitignore
├── .mise.toml               # Global styles & Tailwind configs
├── AGENST.md
├── CLAUDE.md
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vite.config.ts

```

# Core Pages

[x] 1. Halaman Beranda
- Menampilkan daftar kafe unggulan dan yang sedang tren.

- Mendukung pencarian berdasarkan nama kafe atau lokasi.

- Menampilkan kafe yang direkomendasikan berdasarkan preferensi pengguna (fitur AI opsional).

- Tampilkan kartu kafe yang berisi:

- Gambar sampul
- Nama
- Kota
- Peringkat
- Kategori
- Deskripsi singkat

---

[x] 2. Halaman Detail Kafe
Setiap kafe harus memiliki halaman detail khusus yang berisi:

- Gambar sampul/header besar
- Nama kafe
- Alamat
- Jam buka
- Kategori (misalnya Estetika, Belajar, Nongkrong)
- Peringkat rata-rata
- Deskripsi
- Galeri

[x] Bagian Menu
Tampilkan menu kafe termasuk:
- Gambar menu (opsional)
- Nama menu
- Harga
- Deskripsi

[x] Bagian Ulasan
Tampilkan ulasan yang dikirimkan oleh pengguna:
- Avatar pengguna
- Nama pengguna
- Peringkat (1–5 bintang)
- Teks ulasan
- Foto yang diunggah (opsional)
- Tanggal ulasan

Pengguna yang terautentikasi dapat:
- Menulis ulasan
- Memberikan peringkat bintang
- Mengunggah foto
- Mengedit atau menghapus ulasan mereka sendiri

---

[x] 3. Umpan Komunitas
Pengguna Pengguna dapat membuat postingan terkait kafe.

Setiap postingan berisi:
- Keterangan
- Gambar
- Kafe terkait
- Lokasi
- Tanggal posting

Pengguna dapat:
- Menyukai postingan
- Memberi komentar pada postingan
- Menyimpan postingan
- Membagikan postingan (opsional)

---

[x] 4. Halaman Buat Postingan
Pengguna yang terautentikasi dapat membuat postingan baru.

Kolom:
- Kafe
- Keterangan
- Foto
- Kategori
- Tag

---

[x] 5. Halaman Profil

Tampilan informasi pengguna:
- Foto profil
- Nama
- Nama pengguna
- Email
- Bio
- Tanggal bergabung

Tab:
- Postingan Saya
- Postingan Tersimpan
- Ulasan
- Lencana
- Statistik

Pengguna dapat mengedit:
- Nama
- Email
- Kata sandi
- Bio
- Foto profil

---

[x] 6. Pesan Kopi

Pengguna dapat memesan menu dari café yang tersedia.

icon dan menu tambahan di navbar:
- cart icon

Alur pemesanan:
**Pesan → List Order → Checkout → Pembayaran**

### Pesan
- Pilihan default yaitu semua, menampilkan kopi yang paling diminati dan trend dari berbagai café.
- Pengguna dapat memilih café melalui select box.
- Setelah café dipilih, tampilkan semua menu yang tersedia di café tersebut.
- Pengguna dapat memilih menu, menentukan jumlah, dan menambahkannya ke pesanan.

### List Order
- Tampilkan café yang dipilih dan semua menu yang dipesan.
- Pengguna dapat menambah/mengurangi jumlah atau menghapus menu.
- Tampilkan subtotal dan total pesanan.
- Pesanan hanya dapat berisi menu dari satu café.

### Checkout
- Tampilkan ringkasan pesanan, data pengguna, catatan pesanan, dan total pembayaran.
- Pengguna dapat memeriksa pesanan sebelum melanjutkan pembayaran.

### Pembayaran
- Pengguna memilih metode pembayaran.
- Tampilkan total pembayaran dan status pembayaran.
- Setelah pembayaran berhasil, tampilkan konfirmasi pesanan.

### Authentication
- Pengguna harus login untuk melakukan checkout dan pembayaran.
- Pesanan dan riwayat transaksi tersimpan pada akun pengguna.

---

# Tata Letak

[x] Sidebar Kiri
Opsi penyaringan:

[x] Kota
- Jakarta
- Bandung
- Bogor
- Surabaya
- dll.

[x] Kategori
- Tempat Nongkrong
- Kafe Estetik
- Kafe Belajar
- Kedai Kopi
- Luar Ruangan
- Dalam Ruangan
- Tempat Tenang
- 24 Jam

---

[x] Sidebar Kanan

Tampilan:

- Kafe yang sedang tren
- Kontributor teratas
- Tag populer
- Terbaru Ulasan

---

## Otentikasi

Hanya pengguna yang terautentikasi yang dapat:
- Membuat postingan
- Menyukai postingan
- Menyimpan postingan
- Menulis ulasan
- Mengunggah gambar
- Mengedit profil
- Mengikuti pengguna lain (opsional)

Pengguna tamu hanya dapat melihat-lihat konten.

---

### Features
[x] Fitur Komunitas

- Buat postingan
- Edit postingan sendiri
- Hapus postingan sendiri
- Sukai postingan
- Simpan postingan
- Beri komentar pada postingan
- Laporkan postingan yang tidak pantas (opsional)

---

[x] Fitur Ulasan

- Beri peringkat bintang
- Tulis ulasan
- Unggah foto ulasan
- Edit ulasan
- Hapus ulasan

---

[x] Keranjang Pesanan

- Hapus
- Simpan untuk nanti
- Pindahkan ke daftar keinginan

---

[x] Fitur Checkout

leftbar:
- Alamat penagihan
- Metode pembayaran

rightbar:
- Ringkasan pesanan
- tombol bayar

---

[x] Fitur Pembayaran

- generate qrocode jika memilih qris
- va jika memilih bank
- Tombol kirim bukti pembayaran

---

[x] Fitur Pengguna

- Edit profil
- Ubah kata sandi
- Unggah avatar
- Lihat postingan sendiri
- Lihat postingan yang tersimpan
- Lihat riwayat ulasan

---

[x] Gamifikasi

Tingkatkan keterlibatan pengguna melalui pencapaian.

Contoh:
- Penjelajah Kopi
- Peninjau Teratas
- Kontributor Teratas
- Kreator yang Sedang Naik Daun

Papan Peringkat berdasarkan:
- Total postingan
- Total suka yang diterima
- Total ulasan
- Keterlibatan komunitas

Pengguna mendapatkan:
- XP
- Level
- Lencana

---

[x] Chatbot

Membantu pengguna memahami komposisi dari minuman kopi, kalori, dan berapa konsumsi batas gua yang disarkan untuk dikonsumsi.

catatan:
For all users without credentials

Contoh:
- Berapa kalori kopi x
- Berapa kadar gula kopi x
- ingredients dari kopi x
- waktu terbaik untuk minum kopi
- kafe hits aestetik di bandung

Di dalam chatbot berikan tombol shortcut dari rekomendasi pertanyaan di atas. chatbot sederhana dibuat dari query databasse bukan dari API AI.

---

[x] Daftar Mitra Usaha

Authenticated users dapat mendaftarkan usaha café/kedai mereka sebagai mitra.

### Kepemilikan Usaha
- Setiap usaha hanya memiliki satu pemilik/admin utama.
- User yang mendaftarkan usaha otomatis menjadi **Owner/Admin** usaha tersebut.
- Owner hanya dapat mengelola usaha yang dimilikinya.
- User biasa tidak dapat mengakses dashboard atau data pengelolaan usaha milik user lain.

### Fitur Pengelolaan Usaha

Owner/Admin dapat:

- Menambahkan dan mengedit informasi café.
- Menambahkan foto café.
- Mengubah deskripsi dan informasi café.
- Menambahkan, mengedit, dan menghapus produk makanan/minuman.
- Mengatur harga dan ketersediaan produk.
- Mengelola menu café.
- Melihat dan menerima pesanan pelanggan.
- Mengubah status pesanan.
- Melihat riwayat pesanan.

### Dashboard Mitra

Setiap Owner/Admin memiliki dashboard khusus untuk mengelola usahanya.

Dashboard menampilkan:
- Total pesanan.
- Total pendapatan.
- Produk terlaris.
- Pesanan terbaru.
- Status pesanan.
- Statistik penjualan.
- Rating dan review pelanggan.

### Role

Gunakan dua role utama:

- `USER` — pengguna/pelanggan.
- `BUSINESS_OWNER` — pemilik/admin café.

`BUSINESS_OWNER` dapat tetap menggunakan seluruh fitur sebagai `USER`, tetapi juga memiliki akses ke dashboard dan fitur pengelolaan usaha.

---


# Entitas Basis Data

- Pengguna
- Kafe
- Menu
- Kategori
- Ulasan
- Peringkat
- Postingan
- Komentar
- Suka
- Postingan Tersimpan
- Gambar
- Lencana
- Prestasi Pengguna

---

# Persyaratan Non-fungsional

- Desain responsif
- UI modern
- Mode gelap/terang
- Pemuatan cepat
- Otentikasi aman (JWT)
- Pemuatan gambar yang dioptimalkan
- Ramah seluler

## Code Conventions
- TypeScript strict mode = Wajib menggunakan strict mode. Dilarang keras menggunakan tipe any. Gunakan unknown jika tipe data tidak dapat diprediksi saat compile.
- Components: Menggunakan Functional Components dengan eksplisit mengetik nilai return atau props:
interface DashboardProps { title: string; }
export const DashboardCard = ({ title }: DashboardProps): React.JSX.Element => { ... }
- Imports: Gunakan path alias @/ untuk semua import absolut (contoh: import { Button } from '@/components/ui/button'). Urutkan import: framework/external library -> internal alias -> styles/types.
- Icons: Gunakan package react-icons/md (Material Design Icons) secara konsisten untuk menjaga keseragaman UI dashboard.
- Class Names: Gunakan utility function cn() (kombinasi clsx dan tailwind-merge) untuk penggabungan kelas Tailwind yang dinamis atau kondisional.

---

## Environment Variables

Salin .env.example menjadi .env.local dan lengkapi variabel berikut:

## Do not
- Jangan melakukan direct mutation pada state Zustand atau state React.
- Jangan melakukan hardcode string untuk text UI yang bersifat statis; gunakan next-intl untuk manajemen bahasa.
- Jangan meloloskan parsing data dari input form tanpa validasi (gunakan Zod atau library validator sejenis).

## Do

- Setiap ingin merubah kodingan baca Core Pages dan Features. Jika terdapat - [ ] perbaiki kodingan lalu update README.md setiap selesai mengerjakan ubah di bagian core pages dan features menjadi [x] SUDAH SELESAI / DONE / TASK COMPLETED atau - [ ] (hanya spasi kosong) jika belum selesai.

## Testing
- Unit & Integration: Jalankan pengujian komponen dengan Jest dan React Testing Library jika dikonfigurasi.
- Command: run test

## Build

- Pastikan proses linting tidak menghasilkan error atau warning krusial sebelum melakukan build.
- Jalankan npm run build untuk memvalidasi kesesuaian tipe data TypeScript pada seluruh rute halaman sebelum naik ke production.

## Gil Rules
- Branch Naming: Gunakan format feat/nama-fitur, fix/nama-bug, atau refactor/nama-bagian.
- Commit Messages: Ikuti konvensi Conventional Commits:
- feat(dashboard): tambah grafik statistik aspirasi jakshel
- fix(theme): perbaiki warna teks pada tema ramadan
- chore: update dependencies ke versi terbaru
- Pull Request: Setiap PR wajib melalui proses review dan dipastikan berhasil melewati fase build lokal tanpa error.
