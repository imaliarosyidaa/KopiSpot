# KopiSpot ☕

Sebuah aplikasi web modern yang membantu pengguna menemukan kafe-kafe yang estetik, populer, dan sedang tren. Pengguna dapat menjelajahi kafe untuk belajar, bekerja, nongkrong, atau mengambil foto. Setiap halaman kafe menyertakan informasi detail, menu, ulasan, peringkat, dan konten yang dihasilkan komunitas.

## Tech Stack

| Tool          | Versi / Catatan                                  |
|---------------|--------------------------------------------------|
| React         | v19                                              |
| TypeScript    | Strict Mode                                      |
| Tailwind CSS  | v4.0+ (`@tailwindcss/vite`)                      |
| Express       | v5 (backend API)                                 |
| Prisma        | v6.19.3 + PostgreSQL (Render)                    |
| Vite          | v8                                               |
| Zustand       | Global State Management                          |

## Cara Menjalankan

### Backend (server/)

```bash
cd server
npm install
# Salin .env.example menjadi .env dan isi DATABASE_URL, JWT_SECRET
npm run db:generate   # prisma generate
npm run db:seed       # seed data awal
npm run dev           # API di http://localhost:4000
```

### Frontend (root)

```bash
npm install
npm run dev           # Vite dev server (default port 8443)
npm run build         # build produksi
```

### Demo Login

- Email: `demo@kopispot.id`
- Password: `kopispot123`

---

## Deploy ke Produksi

### 1. Backend → Render Web Service

1. Push repo ke GitHub, lalu di dashboard Render buat **New → Blueprint** dari repo tersebut (`render.yaml` sudah tersedia di root).
2. Isi env vars yang bertanda `sync: false` pada service **kopispot-api**:
   - `DATABASE_URL` — connection string PostgreSQL (pakai Render Postgres atau provider lain).
   - `JWT_SECRET` — secret acak (`openssl rand -base64 32`).
   - `JWT_EXPIRES_IN` — mis. `7d`.
   - `CLIENT_ORIGIN` — URL frontend (opsional; CORS saat ini terbuka).
3. Build akan otomatis menjalankan `npx prisma generate` + `npx prisma migrate deploy` lalu start `node src/index.js`.
4. Catat URL service, mis. `https://kopispot-api.onrender.com`.

> Pastikan folder `server/prisma/migrations/` ikut ter-commit ke git agar `prisma migrate deploy` bekerja.
> Plan free Render tidur saat tidak dipakai; permintaan pertama akan membutuhkan beberapa detik.

### 2. Frontend → Vercel

1. Di dashboard Vercel, import repo dengan framework **Vite** (`vercel.json` sudah menyediakan `buildCommand`, `outputDirectory`, dan SPA rewrite).
2. Tambah env var **`VITE_API_URL`** = URL API Render + `/api`, mis. `https://kopispot-api.onrender.com/api`, lalu **redeploy**.
3. Salin `.env.example` root menjadi `.env.local` jika ingin menimpa default `http://localhost:4000/api` saat development.

Tanpa `VITE_API_URL`, build di produksi tetap memakai default `http://localhost:4000/api` sehingga halaman tidak dapat menghubungi API (ERR_CONNECTION_REFUSED).

---

## Checklist Fitur

### Core Pages

[x] SUDAH SELESAI 1. Halaman Beranda

- Menampilkan daftar kafe unggulan dan yang sedang tren.
- Mendukung pencarian berdasarkan nama kafe atau lokasi.
- Menampilkan kafe yang direkomendasikan berdasarkan preferensi pengguna (fitur AI opsional).
- Tampilkan kartu kafe yang berisi: gambar sampul, nama, kota, peringkat, kategori, deskripsi singkat.

[x] SUDAH SELESAI 2. Halaman Detail Kafe

- Gambar sampul/header besar, nama kafe, alamat, jam buka, kategori, peringkat rata-rata, deskripsi, galeri.
- Bagian Menu: gambar menu (opsional), nama menu, harga, deskripsi.
- Bagian Ulasan: avatar, nama pengguna, peringkat (1–5 bintang), teks ulasan, foto unggahan (opsional), tanggal.
- Pengguna terautentikasi dapat menulis ulasan, memberi peringkat bintang, mengunggah foto, mengedit/menghapus ulasan mereka.

[x] SUDAH SELESAI 3. Umpan Komunitas

- Pengguna dapat membuat postingan terkait kafe (keterangan, gambar, kafe terkait, lokasi, tanggal).
- Pengguna dapat menyukai, memberi komentar, dan menyimpan postingan.

[x] SUDAH SELESAI 4. Halaman Buat Postingan

- Kolom: kafe, keterangan, foto, kategori, tag.

[x] SUDAH SELESAI 5. Halaman Profil

- Foto profil, nama, nama pengguna, email, bio, tanggal bergabung.
- Tab: Postingan Saya, Postingan Tersimpan, Ulasan, Lencana, Statistik.
- Pengguna dapat mengedit nama, email, kata sandi, bio, dan foto profil.

[x] SUDAH SELESAI 6. Chatbot

- Membantu pengguna memahami komposisi minuman kopi, kalori, dan batas konsumsi gula yang disarankan.
- Dapat diakses semua pengguna tanpa kredensial.
- Contoh pertanyaan:
  - Berapa kalori kopi x
  - Berapa kadar gula kopi x
  - ingredients dari kopi x
  - waktu terbaik untuk minum kopi
  - kafe hits aestetik di bandung
- Terdapat tombol shortcut untuk pertanyaan rekomendasi di atas.
- Chatbot sederhana dibuat dari query database (bukan API AI).

[x] SUDAH SELESAI 7. Pesan Kopi

- Ikon keranjang di navbar dengan jumlah item yang dipesan.
- Alur: Pesan → List Order → Checkout → Pembayaran.
- Pesan: pilih café melalui select box, tampilkan semua menu café, tentukan jumlah lalu tambahkan ke pesanan.
- List Order: tampilkan café terpilih dan menu yang dipesan, atur jumlah/hapus menu, subtotal dan total, hanya berisi menu dari satu café.
- Checkout: ringkasan pesanan, data pengguna, catatan pesanan, dan total pembayaran.
- Pembayaran: pilih metode pembayaran (QRIS, Virtual Account, E-Wallet, Kartu, Bayar di Kafe), total & status pembayaran, lalu konfirmasi pesanan.
- Pengguna harus login untuk checkout dan pembayaran; pesanan & riwayat transaksi tersimpan pada akun pengguna.

### Tata Letak

[x] SUDAH SELESAI Sidebar Kiri

- Penyaringan Kota (Jakarta, Bandung, Bogor, Surabaya, dll).
- Penyaringan Kategori.

[x] SUDAH SELESAI Sidebar Kanan

- Kafe yang sedang tren, kontributor teratas, tag populer, terbaru ulasan.

### Otentikasi

[x] SUDAH SELESAI Autentikasi (JWT)

- Hanya pengguna terautentikasi yang dapat membuat postingan, menyukai, menyimpan, menulis ulasan, mengunggah gambar, mengedit profil.
- Pengguna tamu dapat melihat-lihat konten.

### Features

[x] SUDAH SELESAI Fitur Komunitas

- Buat, edit, hapus postingan sendiri.
- Sukai, simpan, beri komentar pada postingan.

[x] SUDAH SELESAI Fitur Ulasan

- Beri peringkat bintang, tulis ulasan, unggah foto ulasan, edit & hapus ulasan.

[x] SUDAH SELESAI Fitur Pengguna

- Edit profil, ubah kata sandi, unggah avatar, lihat postingan sendiri, lihat postingan tersimpan, riwayat ulasan.

[x] SUDAH SELESAI Gamifikasi

- Lencana: Penjelajah Kopi, Peninjau Teratas, Kontributor Teratas, Kreator yang Sedang Naik Daun.
- Papan peringkat, XP, level, dan lencana.

[x] SUDAH SELESAI Keranjang Pesanan

- Hapus menu dari pesanan, simpan untuk nanti, dan pindahkan ke daftar keinginan.
- Daftar "Simpan untuk Nanti" dan "Daftar Keinginan" dapat dikembalikan ke keranjang atau dihapus.

[x] SUDAH SELESAI Fitur Checkout

- Leftbar: alamat penagihan (nama, no. HP, alamat, kota, kode pos) dan pemilihan metode pembayaran.
- Rightbar: ringkasan pesanan, catatan pesanan, total pembayaran, dan tombol bayar.

[x] SUDAH SELESAI Fitur Pembayaran

- QRIS menampilkan QR code yang bisa dipindai.
- Virtual Account (bank) menampilkan nomor VA yang bisa disalin.
- Tombol kirim bukti pembayaran (unggah gambar) sebelum konfirmasi pesanan.

[x] SUDAH SELESAI Daftar Mitra Usaha

- User dapat mendaftarkan usaha café/kedai dari halaman `/mitra`.
- User yang mendaftarkan usaha otomatis menjadi pemilik (BUSINESS_OWNER) kafe tersebut.
- Owner hanya dapat mengelola usaha yang dimilikinya.
- Owner dapat menambah, mengedit, dan menghapus kafe serta mengunggah foto.
- Owner dapat menambah, mengedit, dan menghapus produk, mengatur harga, dan ketersediaan produk.
- Owner dapat melihat dan menerima pesanan pelanggan serta mengubah status pesanan.
- Dashboard Mitra menampilkan: total pesanan, total pendapatan, produk terlaris, pesanan terbaru, status pesanan, rating, dan review pelanggan.

---

## Endpoint API (Ringkasan)

- `POST /api/auth/login`, `POST /api/auth/register`
- `GET /api/places`, `GET /api/places/:id`, `POST /api/places`
- `POST /api/places/:id/rate`, `POST /api/places/:id/comments`
- `POST /api/chat` — tanya asisten kopi (tanpa login)
- `GET /api/menus` — daftar menu kafe (`?placeId=`)
- `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders`, `PUT /api/orders/:id/pay`, `DELETE /api/orders/:id`
- `POST /api/partner/register` — daftarkan usaha mitra
- `GET /api/partner/places` — daftar usaha milik user
- `GET /api/partner/dashboard/:placeId` — ringkasan dashboard mitra
- `GET|POST|PUT|DELETE /api/partner/places/:placeId/menus[/:menuId]` — kelola menu
- `GET /api/partner/places/:placeId/orders` + `PUT .../orders/:orderId/status` — kelola pesanan
- `GET /api/feed/right` — konten sidebar kanan
- `GET /api/users/me`, `PUT /api/users/me`, `GET /api/users/leaderboard`

---

## Entitas Basis Data

Pengguna, Kafe, Menu, Kategori, Ulasan, Peringkat, Postingan, Komentar, Suka, Postingan Tersimpan, Gambar, Lencana, Prestasi Pengguna, Pesanan, Item Pesanan.
