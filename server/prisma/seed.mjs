import {
  PrismaClient,
  PlaceCategory,
  OrderStatus,
  ReservationStatus,
} from "@prisma/client"

import bcrypt from "bcryptjs"

import { recomputeGamification } from "../src/gamification.js"

const { hash } = bcrypt

const prisma = new PrismaClient()

const placeData = [
  {
    name: "Anomali Coffee",

    category: PlaceCategory.SPECIALTY,

    description:
      "Spot paling ikonik buat coffee enthusiast. Interior bata merah ekspos dengan pencahayaan warm yang bikin setiap foto keliatan editorial banget. Kopinya serius — single origin Flores dan Toraja.",

    address: "Jalan Senopati No. 19",

    city: "Jakarta Selatan",

    price: "Rp 45.000 – 75.000",

    openHours: "07.00 – 22.00",

    imageUrl:
      "https://images.unsplash.com/photo-1685718913827-4321d75a19cd?w=800&h=600&fit=crop&auto=format",

    tags: ["Specialty Coffee", "Instagramable", "Work-Friendly"],

    wifi: true,

    cozy: true,
  },

  {
    name: "Kopi Tuku",

    category: PlaceCategory.LOCAL,

    description:
      "Pelopor kopi susu kekinian yang masih relevan. Antrian panjang tapi worth it. Konsepnya kasual dengan nuansa kampung kota yang hangat dan genuine — bukan pura-pura artsy.",

    address: "Jalan Cipete Raya No. 12",

    city: "Jakarta Selatan",

    price: "Rp 28.000 – 55.000",

    openHours: "07.00 – 21.00",

    imageUrl:
      "https://images.unsplash.com/photo-1749631236680-bcdb75bd1001?w=800&h=600&fit=crop&auto=format",

    tags: ["Kopi Susu", "Viral", "Casual"],

    wifi: true,

    cozy: true,
  },

  {
    name: "Nusantara Coffee",

    category: PlaceCategory.INSTAGRAMABLE,

    description:
      "Duduk di tepi sawah dengan secangkir kopi Kintamani panas. Suasana Ubud yang tenang bikin produktivitas naik drastis. Golden hour di sini literally surga buat fotografer.",

    address: "Jalan Raya Campuhan",

    city: "Ubud, Bali",

    price: "Rp 35.000 – 65.000",

    openHours: "08.00 – 20.00",

    imageUrl:
      "https://images.unsplash.com/photo-1759156240748-c873004abdb2?w=800&h=600&fit=crop&auto=format",

    tags: ["Rice Field View", "Viral", "Outdoor"],

    wifi: true,

    cozy: true,
  },

  {
    name: "Tanamera Coffee",

    category: PlaceCategory.STUDY_SPACE,

    description:
      "Konsep roastery yang bersih dan profesional. Langit-langit tinggi, meja lebar, outlet di mana-mana. Tempat paling produktif di Jakarta buat remote work marathon seharian.",

    address: "Jalan Jend. Sudirman Kav. 21",

    city: "Jakarta",

    price: "Rp 50.000 – 85.000",

    openHours: "07.30 – 21.30",

    imageUrl:
      "https://images.unsplash.com/photo-1776483751775-36ca104e7349?w=800&h=600&fit=crop&auto=format",

    tags: ["Roastery", "Work-Friendly", "Specialty"],

    wifi: true,

    cozy: false,
  },

  {
    name: "Common Grounds",

    category: PlaceCategory.INSTAGRAMABLE,

    description:
      "Desain interior paling cincin di Jakarta — kombinasi tanaman hijau, kayu gelap, dan beton ekspos. Perfect spot buat meeting atau sekadar tampil keren di Instagram feed.",

    address: "SCBD Lot 8, Jalan Jend. Sudirman",

    city: "Jakarta Selatan",

    price: "Rp 55.000 – 95.000",

    openHours: "07.00 – 23.00",

    imageUrl:
      "https://images.unsplash.com/photo-1774758959178-094de5122e29?w=800&h=600&fit=crop&auto=format",

    tags: ["Instagramable", "All-Day", "Premium"],

    wifi: true,

    cozy: true,
  },

  {
    name: "Folks Coffee",

    category: PlaceCategory.HIDDEN_GEM,

    description:
      "Hidden gem Bandung yang selalu ramai di weekend. Konsep Japandi dengan sentuhan lokal — bambu, bata, tanaman. Kopi Priangan mereka punya karakter asam citrus yang segar.",

    address: "Jalan Braga No. 27",

    city: "Bandung",

    price: "Rp 30.000 – 60.000",

    openHours: "08.00 – 21.00",

    imageUrl:
      "https://images.unsplash.com/photo-1621871305450-7d9a2c6e6149?w=800&h=600&fit=crop&auto=format",

    tags: ["Japandi", "Hidden Gem", "Local Coffee"],

    wifi: false,

    cozy: true,
  },
]

const menuImageByCategory = {
  coffee:
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop&auto=format",

  "non-coffee":
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=600&fit=crop&auto=format",

  food: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop&auto=format",

  dessert:
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop&auto=format",
}

const menuByPlace = {
  "Anomali Coffee": [
    {
      name: "Espresso",
      price: 25000,
      category: "coffee",
      description:
        "Shot kopi pekat dari biji pilihan, disajikan tanpa campuran.",
      calories: 2,
      sugar: 0,
      ingredients: "Biji kopi arabika, air",
    },

    {
      name: "V60 Flores Bajawa",
      price: 40000,
      category: "coffee",
      description:
        "Kopi manual brew single origin Flores Bajawa dengan profil rasa fruity dan floral.",
      calories: 3,
      sugar: 0,
      ingredients: "Biji kopi Flores Bajawa, air panas",
    },

    {
      name: "Flat White",
      price: 45000,
      category: "coffee",
      description: "Kopi susu creamy dengan tekstur mikrofoam lembut.",
      calories: 120,
      sugar: 9,
      ingredients: "Espresso, susu full cream",
    },

    {
      name: "Iced Long Black",
      price: 38000,
      category: "coffee",
      description: "Double shot espresso disajikan dingin di atas es.",
      calories: 5,
      sugar: 0,
      ingredients: "Double shot espresso, air, es batu",
    },

    {
      name: "Croissant Butter",
      price: 30000,
      category: "food",
      description:
        "Croissant panggang dengan mentega premium, gurih dan renyah.",
      calories: 310,
      sugar: 8,
      ingredients: "Tepung terigu, mentega, susu, telur",
    },

    {
      name: "Brownie Coklat",
      price: 35000,
      category: "dessert",
      description: "Brownie coklat fudgy dengan coklat Belgia.",
      calories: 380,
      sugar: 32,
      ingredients: "Coklat Belgia, mentega, telur, gula",
    },
  ],

  "Kopi Tuku": [
    {
      name: "Es Kopi Susu Tuku",
      price: 24000,
      category: "coffee",
      description: "Kopi susu ikonik Tuku dengan gula aren asli.",
      calories: 190,
      sugar: 22,
      ingredients: "Kopi robusta, susu, gula aren",
    },

    {
      name: "Kopi Susu Gula Aren",
      price: 26000,
      category: "coffee",
      description: "Kopi susu dengan gula aren, manisnya pas.",
      calories: 200,
      sugar: 24,
      ingredients: "Kopi, susu, gula aren",
    },

    {
      name: "Kopi Tubruk",
      price: 18000,
      category: "coffee",
      description: "Kopi tubruk khas Indonesia dengan ampas kopi.",
      calories: 5,
      sugar: 0,
      ingredients: "Bubuk kopi robusta, air panas, gula (opsional)",
    },

    {
      name: "Es Teh Tarik",
      price: 20000,
      category: "non-coffee",
      description: "Teh tarik dingin yang creamy dan segar.",
      calories: 90,
      sugar: 18,
      ingredients: "Teh hitam, susu kental manis, es batu",
    },

    {
      name: "Pisang Goreng Keju",
      price: 15000,
      category: "food",
      description: "Pisang goreng crispy dengan taburan keju.",
      calories: 240,
      sugar: 15,
      ingredients: "Pisang raja, tepung, keju",
    },
  ],

  "Nusantara Coffee": [
    {
      name: "Kopi Kintamani",
      price: 35000,
      category: "coffee",
      description: "Kopi single origin Kintamani dengan rasa citrus segar.",
      calories: 4,
      sugar: 0,
      ingredients: "Biji kopi Kintamani, air panas",
    },

    {
      name: "Kopi Robusta Bali",
      price: 30000,
      category: "coffee",
      description: "Kopi robusta Bali yang kuat dan bersahabat.",
      calories: 4,
      sugar: 0,
      ingredients: "Biji kopi robusta Bali, air panas",
    },

    {
      name: "Teh Tarik",
      price: 22000,
      category: "non-coffee",
      description: "Teh tarik hangat dengan buih susu yang lembut.",
      calories: 110,
      sugar: 20,
      ingredients: "Teh hitam, susu, gula",
    },

    {
      name: "Nasi Campur Bali",
      price: 45000,
      category: "food",
      description: "Nasi campur khas Bali dengan ayam suwir dan sambal matah.",
      calories: 520,
      sugar: 6,
      ingredients: "Nasi, ayam suwir, sambal matah, sayur urap, kacang goreng",
    },
  ],

  "Tanamera Coffee": [
    {
      name: "Filter Single Origin",
      price: 55000,
      category: "coffee",
      description: "Kopi filter single origin dengan profil rasa kompleks.",
      calories: 3,
      sugar: 0,
      ingredients: "Biji kopi single origin, air panas",
    },

    {
      name: "Espresso",
      price: 30000,
      category: "coffee",
      description: "Shot espresso pekat ala Tanamera.",
      calories: 3,
      sugar: 0,
      ingredients: "Biji kopi espresso, air",
    },

    {
      name: "Latte",
      price: 48000,
      category: "coffee",
      description: "Espresso dengan susu steamed yang lembut.",
      calories: 130,
      sugar: 10,
      ingredients: "Espresso, susu full cream",
    },

    {
      name: "Iced Long Black",
      price: 40000,
      category: "coffee",
      description: "Espresso dingin segar di atas es.",
      calories: 5,
      sugar: 0,
      ingredients: "Espresso, air, es batu",
    },

    {
      name: "Chicken Pesto Sandwich",
      price: 65000,
      category: "food",
      description: "Sandwich roti sourdough dengan ayam pesto.",
      calories: 450,
      sugar: 5,
      ingredients: "Roti sourdough, ayam, saus pesto, sayuran",
    },
  ],

  "Common Grounds": [
    {
      name: "Cappuccino",
      price: 55000,
      category: "coffee",
      description: "Espresso, susu steamed, dan buih susu tebal.",
      calories: 110,
      sugar: 9,
      ingredients: "Espresso, susu, microfoam",
    },

    {
      name: "Cold Brew",
      price: 60000,
      category: "coffee",
      description: "Kopi seduh dingin 12 jam, smooth dan minim asam.",
      calories: 5,
      sugar: 0,
      ingredients: "Biji kopi, air dingin",
    },

    {
      name: "All Day Breakfast",
      price: 95000,
      category: "food",
      description: "Menu sarapan lengkap: telur, roti, sosis, dan kentang.",
      calories: 650,
      sugar: 8,
      ingredients: "Telur, roti panggang, sosis, kentang, salad",
    },

    {
      name: "Spaghetti Aglio Olio",
      price: 85000,
      category: "food",
      description: "Spaghetti aglio olio dengan bawang putih dan cabai.",
      calories: 480,
      sugar: 4,
      ingredients: "Spaghetti, bawang putih, minyak zaitun, cabai",
    },
  ],

  "Folks Coffee": [
    {
      name: "Kopi Priangan",
      price: 30000,
      category: "coffee",
      description: "Kopi Priangan dengan karakter asam citrus yang segar.",
      calories: 4,
      sugar: 0,
      ingredients: "Biji kopi Priangan, air panas",
    },

    {
      name: "Manual Brew",
      price: 40000,
      category: "coffee",
      description: "Kopi manual brew dengan metode pilihan barista.",
      calories: 4,
      sugar: 0,
      ingredients: "Biji kopi pilihan, air panas",
    },

    {
      name: "Es Kopi Susu",
      price: 32000,
      category: "coffee",
      description: "Es kopi susu lembut dengan gula aren.",
      calories: 185,
      sugar: 21,
      ingredients: "Kopi, susu, gula aren, es batu",
    },

    {
      name: "Sourdough Toast",
      price: 45000,
      category: "food",
      description: "Roti sourdough panggang dengan mentega dan madu.",
      calories: 330,
      sugar: 14,
      ingredients: "Roti sourdough, mentega, madu",
    },
  ],
}

const ratingByPlace = {
  "Anomali Coffee": [5, 5, 5, 4],

  "Kopi Tuku": [5, 5, 4, 5],

  "Nusantara Coffee": [5, 5, 5, 5],

  "Tanamera Coffee": [5, 4, 5, 4],

  "Common Grounds": [5, 5, 5, 4],

  "Folks Coffee": [5, 5, 4, 5],
}

const commentByPlace = {
  "Anomali Coffee": [
    {
      user: 0,
      body: "Anomali Coffee selalu jadi langganan saya tiap kali meeting klien. Ambiance-nya premium tapi nggak bikin kikuk. Barista-nya juga ramah dan mau jelasin origin kopi.",
    },
  ],

  "Kopi Tuku": [
    {
      user: 1,
      body: "Kopi Tuku nggak ada tandingannya buat kopi susu kekinian. Sudah coba puluhan tempat tapi selalu balik ke sini. The classic never dies!",
    },
  ],

  "Nusantara Coffee": [
    {
      user: 2,
      body: "Nusantara Coffee di Ubud literally healing buat jiwa. Scroll sambil dengerin suara angin sawah dengan segelas Kintamani — definition of perfect morning.",
    },
  ],

  "Tanamera Coffee": [
    {
      user: 3,
      body: "Tanamera jadi basecamp WFH saya. Wifi kenceng, colokan banyak, dan kopinya konsisten. Satu-satunya minus adalah agak ramai di jam makan siang.",
    },
  ],
}

async function main() {
  console.log("Seeding Coffidoor database...")

  await prisma.userAchievement.deleteMany()

  await prisma.postComment.deleteMany()

  await prisma.postLike.deleteMany()

  await prisma.savedPost.deleteMany()

  await prisma.post.deleteMany()

  await prisma.orderItem.deleteMany()

  await prisma.order.deleteMany()

  await prisma.reservation.deleteMany()

  await prisma.placeView.deleteMany()

  await prisma.comment.deleteMany()

  await prisma.rating.deleteMany()

  await prisma.menuItem.deleteMany()

  await prisma.place.deleteMany()

  await prisma.badge.deleteMany()

  const password = await hash("Coffidoor123", 10)

  const names = [
    { name: "Dira Kusuma", email: "dira@Coffidoor.id" },

    { name: "Rizal Firmansyah", email: "rizal@Coffidoor.id" },

    { name: "Salsabila Putri", email: "salsabila@Coffidoor.id" },

    { name: "Agung Wibowo", email: "agung@Coffidoor.id" },

    { name: "Admin Coffidoor", email: "demo@Coffidoor.id" },
  ]

  const users = []

  for (const u of names) {
    const user = await prisma.user.upsert({
      where: { email: u.email },

      update: {},

      create: { name: u.name, email: u.email, password },
    })

    users.push(user)
  }

  const raters = users.slice(0, 4)

  const admin = users[4]

  const createdPlaces = {}

  for (const d of placeData) {
    const { tags, ...rest } = d

    const place = await prisma.place.create({
      data: { ...rest, tagsJson: JSON.stringify(tags), authorId: admin.id },
    })

    createdPlaces[place.name] = place

    for (const item of menuByPlace[place.name] ?? []) {
      await prisma.menuItem.create({
        data: {
          ...item,
          imageUrl: item.imageUrl ?? menuImageByCategory[item.category] ?? null,
          placeId: place.id,
        },
      })
    }

    const values = ratingByPlace[place.name] ?? []

    for (let i = 0; i < values.length; i++) {
      await prisma.rating.create({
        data: { placeId: place.id, userId: raters[i].id, value: values[i] },
      })
    }

    for (const c of commentByPlace[place.name] ?? []) {
      await prisma.comment.create({
        data: { placeId: place.id, userId: raters[c.user].id, body: c.body },
      })
    }

    for (let i = 0; i < 8; i++) {
      await prisma.placeView.create({
        data: {
          placeId: place.id,
          userId: i % 2 === 0 ? null : raters[i % 4].id,
        },
      })
    }
  }

  const firstPlace = createdPlaces[placeData[0].name]

  const menuItems = await prisma.menuItem.findMany({
    where: { placeId: firstPlace.id },

    take: 2,
  })

  if (menuItems.length > 0) {
    const total = menuItems.reduce((s, m) => s + m.price, 0)

    await prisma.order.create({
      data: {
        userId: users[0].id,

        placeId: firstPlace.id,

        status: OrderStatus.COMPLETED,

        total,

        items: {
          create: menuItems.map((m) => ({
            menuItemId: m.id,
            quantity: 1,
            price: m.price,
          })),
        },
      },
    })
  }

  const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  await prisma.reservation.create({
    data: {
      userId: users[0].id,

      placeId: firstPlace.id,

      date: future,

      partySize: 2,

      note: "Meja dekat jendela jika tersedia.",

      status: ReservationStatus.CONFIRMED,
    },
  })

  // ─── BADGES ────────────────────────────────────────────────────────────────

  const badgeData = [
    {
      slug: "coffee-explorer",
      name: "Penjelajah Kopi",
      description: "Memberi rating di minimal 3 kafe.",
      icon: "☕",
      xpReward: 50,
    },

    {
      slug: "top-reviewer",
      name: "Peninjau Teratas",
      description: "Menulis minimal 3 ulasan kafe.",
      icon: "⭐",
      xpReward: 100,
    },

    {
      slug: "top-contributor",
      name: "Kontributor Teratas",
      description: "Membuat minimal 3 postingan komunitas.",
      icon: "🏆",
      xpReward: 150,
    },

    {
      slug: "rising-creator",
      name: "Kreator yang Sedang Naik Daun",
      description: "Postinganmu disukai minimal 2 kali.",
      icon: "🚀",
      xpReward: 75,
    },
  ]

  for (const b of badgeData) {
    await prisma.badge.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    })
  }

  // ─── POSTINGAN KOMUNITAS ───────────────────────────────────────────────────

  const postData = [
    {
      user: 1,

      placeName: "Nusantara Coffee",

      caption:
        "Golden hour di tepi sawah Ubud. Kopi Kintamani plus pemandangan ini bikin kerjaan berasa liburan. Siapa yang mau healing di sini?",

      category: "SUASANA",

      tags: ["Rice Field View", "Healing", "Viral"],

      images: [
        "https://images.unsplash.com/photo-1759156240748-c873004abdb2?w=800&h=600&fit=crop&auto=format",
      ],

      likesBy: [2, 3, 4],

      savedBy: [2],

      comments: [
        { user: 2, body: "Wah kapan ini masuk wishlist aku!" },

        { user: 0, body: "Setuju banget, golden hour di sini juara." },
      ],
    },

    {
      user: 2,

      placeName: "Anomali Coffee",

      caption:
        "Sesi V60 Flores Bajawa bareng teman sambil diskusi bisnis. Tempat ini nggak pernah gagal bikin meeting jadi lebih santai dan produktif.",

      category: "NGOPI",

      tags: ["Specialty", "Work-Friendly"],

      images: [
        "https://images.unsplash.com/photo-1685718913827-4321d75a19cd?w=800&h=600&fit=crop&auto=format",
      ],

      likesBy: [0, 1, 4],

      savedBy: [],

      comments: [
        { user: 3, body: "V60-nya recommended, baristanya juga ramah." },
      ],
    },

    {
      user: 3,

      placeName: "Folks Coffee",

      caption:
        "Hidden gem Bandung yang aesthetic-nya juara. Kopi Priangan punya karakter asam citrus yang fresh. Wajib mampir kalau ke Bandung!",

      category: "HIDDEN_GEM",

      tags: ["Japandi", "Hidden Gem"],

      images: [
        "https://images.unsplash.com/photo-1621871305450-7d9a2c6e6149?w=800&h=600&fit=crop&auto=format",
      ],

      likesBy: [0, 2],

      savedBy: [0, 1],

      comments: [],
    },

    {
      user: 0,

      placeName: "Tanamera Coffee",

      caption:
        "Basecamp WFH hari ini. Wifi kenceng, colokan melimpah, kopi konsisten. Produktivitas auto naik 200%.",

      category: "KERJA",

      tags: ["Work-Friendly", "Roastery"],

      images: [
        "https://images.unsplash.com/photo-1776483751775-36ca104e7349?w=800&h=600&fit=crop&auto=format",
      ],

      likesBy: [1],

      savedBy: [],

      comments: [{ user: 2, body: "Ide buat kerja remote weekend ini!" }],
    },
  ]

  for (const p of postData) {
    const place = createdPlaces[p.placeName]

    const post = await prisma.post.create({
      data: {
        authorId: users[p.user].id,

        placeId: place?.id ?? null,

        caption: p.caption,

        category: p.category,

        tagsJson: JSON.stringify(p.tags),

        imagesJson: JSON.stringify(p.images),
      },
    })

    for (const u of p.likesBy) {
      await prisma.postLike.create({
        data: { postId: post.id, userId: users[u].id },
      })
    }

    for (const u of p.savedBy) {
      await prisma.savedPost.create({
        data: { postId: post.id, userId: users[u].id },
      })
    }

    for (const c of p.comments) {
      await prisma.postComment.create({
        data: { postId: post.id, userId: users[c.user].id, body: c.body },
      })
    }
  }

  for (const u of users) {
    await recomputeGamification(u.id)
  }

  console.log("Seeding selesai. Demo user: demo@Coffidoor.id / Coffidoor123")
}

main()

  .catch((e) => {
    console.error(e)

    process.exit(1)
  })

  .finally(() => prisma.$disconnect())
