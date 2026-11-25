import type {
  CardTemplateOption,
  EventItem,
  GrowthUpdate,
  Participant,
  PlantRecord,
  PlantSpecies,
} from '../types/plantJourney';

export const VOLUNTEER_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeXmF-epKSxSYVUqD8ZYJRjQf9LcEKalNIfkl5irM6Slr2RUg/viewform';

export const INSTAGRAM_URL =
  'https://www.instagram.com/sobiunja?utm_source=ig_web_button_share_sheet&hvrq=ZDNlZDc0MzIxNw==';

export const INSTAGRAM_HANDLE = '@sobiunja';

export const WHATSAPP_DISPLAY = '+62 821-7997-5317';
export const WHATSAPP_URL = 'https://wa.me/6282179975317';

export const MEDIA_ASSETS = {
  brandLogo: '/assets/aistudio/sobat_bumi_transparent_df9229fc.png',
  heroForest: '/assets/aistudio/99hu2hh16jrqyd3_93ffb906.jpeg',
  aboutCommunity: '/assets/aistudio/images__1__f4060c8d.jpeg',
  tabebuyaMain: '/assets/aistudio/Bunga-Tabebuya-Kuning-582x1024_75bbc471.webp',
  ketapangMain: '/assets/aistudio/images__2__2a08955d.jpeg',
  satriaPortrait:
    '/assets/aistudio/pngtree-farmer-planting-mango-sapling-in-rural-field-at-sunset-image_18119207_dd80273a.webp',
  nadiaPortrait: '/assets/aistudio/images__2__2a08955d.jpeg',
  growthSapling: '/assets/aistudio/iqjjefrd9amxyja_5532234b.jpeg',
  cardFrontTemplate:
    '/assets/aistudio/Cocard_Aksi_Sobi_9.5x13.5cm_full_bleed_9c5082ad.png',
  cardBackTemplate:
    '/assets/aistudio/Bagian_Belakang_Cocard_Aksi_Sobi_9.5x13.5cm_full_bleed_91f39e71.png',
};

export const CARD_TEMPLATES: CardTemplateOption[] = [
  {
    id: 'forest',
    name: 'Cocard Resmi 2026',
    subtitle: 'Full Bleed · Portrait 9.5 × 13.5 cm',
    description:
      'Desain resmi Cocard Volunteer Aksi Sobat Bumi 2026 lengkap dengan foto, nama, prodi, dan QR Code halaman pohon.',
  },
  {
    id: 'botanical',
    name: 'Cocard Resmi 2026',
    subtitle: 'Full Bleed · Portrait 9.5 × 13.5 cm',
    description:
      'Desain resmi Cocard Volunteer Aksi Sobat Bumi 2026 lengkap dengan foto, nama, prodi, dan QR Code halaman pohon.',
  },
  {
    id: 'earth',
    name: 'Cocard Resmi 2026',
    subtitle: 'Full Bleed · Portrait 9.5 × 13.5 cm',
    description:
      'Desain resmi Cocard Volunteer Aksi Sobat Bumi 2026 lengkap dengan foto, nama, prodi, dan QR Code halaman pohon.',
  },
];

export const SEED_PLANTS: PlantSpecies[] = [
  {
    id: 'plant-tabebuya',
    plantCode: 'PL-001',
    plantName: 'Tabebuya',
    scientificName: 'Handroanthus chrysotrichus',
    category: 'Pohon Peneduh Berbunga',
    mainImage: MEDIA_ASSETS.tabebuyaMain,
    overview:
      'Tabebuya kuning merupakan pohon peneduh tropis yang dikenal dengan mahkota bunga keemasan yang mekar serempak di musim kemarau. Akarnya tumbuh menghunjam ke bawah sehingga aman bagi struktur tanah di sekitar area publik dan jalur hijau.',
    characteristics: {
      treeType: 'Pohon berkayu sedang hingga tinggi (8–15 meter saat dewasa)',
      leafShape: 'Daun majemuk menjari dengan lima helai daun oval bertekstur halus',
      distinctiveTrait: 'Bunga berbentuk terompet berwarna kuning cerah yang berguguran seperti karpet alami',
      habitat: 'Dataran rendah hingga perbukitan tropis dengan drainase tanah baik',
    },
    benefits: [
      'Menyerap polutan udara dan partikel debu halus di kawasan urban maupun ruang terbuka hijau.',
      'Menurunkan suhu mikroklimat sekitar tajuk melalui naungan daun yang rindang.',
      'Menyediakan sumber nektar musiman bagi lebah, kupu-kupu, dan serangga penyerbuk lokal.',
      'Sistem perakaran dalam membantu menjaga stabilitas struktur tanah tanpa merusak permukaan sekitar.',
    ],
    careGuide: {
      watering: 'Penyiraman rutin 2–3 kali seminggu selama 6 bulan pertama setelah tanam, lalu cukup bergantung pada curah hujan alami.',
      sunlight: 'Membutuhkan paparan sinar matahari penuh minimal 6 jam sehari untuk merangsang pembungaan optimal.',
      soil: 'Tanah gembur kaya humus dengan pH netral hingga sedikit asam (6.0–7.0) serta drainase lancar.',
      maintenance: 'Lakukan pemangkasan ringan pada cabang kering di awal musim hujan agar tajuk tumbuh seimbang.',
      growthNotes: 'Rata-rata pertambahan tinggi mencapai 80–120 cm per tahun pada fase muda.',
    },
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'plant-ketapang',
    plantCode: 'PL-002',
    plantName: 'Ketapang',
    scientificName: 'Terminalia catappa',
    category: 'Pohon Kanopi & Konservasi',
    mainImage: MEDIA_ASSETS.ketapangMain,
    overview:
      'Ketapang adalah pohon peneduh asli kawasan tropis Asia Tenggara dengan arsitektur cabang bertingkat horizontal menyerupai payung alami. Daunnya yang lebar memberi perlindungan termal signifikan serta berperan penting dalam pemulihan lahan terbuka.',
    characteristics: {
      treeType: 'Pohon besar berkanopi lebar (15–25 meter saat matang)',
      leafShape: 'Daun tunggal berukuran besar (15–25 cm), bulat telur terbalik dengan permukaan mengilap',
      distinctiveTrait: 'Percabangan bertingkat simetris dan daun berubah kemerahan sebelum gugur musiman',
      habitat: 'Wilayah pesisir, taman kota, bantaran sungai, hingga dataran rendah terbuka',
    },
    benefits: [
      'Membentuk kanopi peneduh luas yang efektif mereduksi paparan panas permukaan tanah.',
      'Tahan terhadap tiupan angin kencang dan kondisi tanah berpasir maupun salinitas ringan.',
      'Daun keringnya mudah terurai menjadi serasah organik yang menyuburkan mikroorganisme tanah.',
      'Menjadi tempat bersarang alami bagi burung-burung pemakan serangga dan kelelawar kecil pemakan buah.',
    ],
    careGuide: {
      watering: 'Siram setiap 2 hari sekali pada bulan pertama penanaman; setelah berakar kuat sangat tahan kekeringan.',
      sunlight: 'Sinar matahari penuh hingga naungan parsial; tumbuh paling simetris di ruang terbuka.',
      soil: 'Adaptif di berbagai jenis tanah termasuk tanah liat berpasir, aluvial, dan tanah pesisir.',
      maintenance: 'Pastikan ajir bambu penopang terpasang kokoh selama 4 bulan awal untuk menjaga batang tetap tegak.',
      growthNotes: 'Membentuk tingkat cabang baru setiap 3–4 bulan pada kondisi nutrisi tanah yang cukup.',
    },
    createdAt: '2026-10-02T08:00:00Z',
  },
];

export const SEED_EVENTS: EventItem[] = [
  {
    id: 'evt-planting-tomorrow',
    slug: 'planting-for-tomorrow-bandung',
    eventName: 'Planting for Tomorrow — Tahura Bandung',
    eventDate: '19 November 2026',
    eventLocation: 'Tahura Ir. H. Djuanda, Bandung',
    description:
      'Aksi penanaman 250 bibit pohon endemik dan peneduh bersama relawan muda untuk memperkuat zona resapan air Bandung Utara.',
    fullStory:
      'Kegiatan pembuka musim hujan Aksi Sobat Bumi yang mempertemukan 85 relawan lintas komunitas. Setiap peserta menanam satu bibit pohon bernomor identitas digital, lengkap dengan pencatatan koordinat dan pemantauan berkala selama 12 bulan pertama.',
    coverImage: MEDIA_ASSETS.aboutCommunity,
    registrationUrl: VOLUNTEER_FORM_URL,
    status: 'Completed',
    treesPlantedTarget: 250,
    volunteerCount: 85,
    createdAt: '2026-10-10T09:00:00Z',
  },
  {
    id: 'evt-coastal-canopy',
    slug: 'coastal-canopy-restoration-jakarta',
    eventName: 'Coastal Canopy Restoration — Marunda',
    eventDate: '14 Desember 2026',
    eventLocation: 'Pesisir Marunda, Jakarta Utara',
    description:
      'Penanaman sabuk hijau pohon Ketapang dan tanaman penahan angin pesisir bersama relawan dan warga lokal.',
    fullStory:
      'Program lanjutan Aksi Sobat Bumi untuk membangun koridor teduh di kawasan pesisir utara Jakarta. Peserta akan mendapatkan pembekalan teknis penanaman tanah pesisir, kartu identitas tanaman dengan QR Code, dan akses pelacakan pertumbuhan.',
    coverImage: MEDIA_ASSETS.heroForest,
    registrationUrl: VOLUNTEER_FORM_URL,
    status: 'Upcoming',
    treesPlantedTarget: 300,
    volunteerCount: 110,
    createdAt: '2026-11-01T09:00:00Z',
  },
];

export const SEED_PARTICIPANTS: Participant[] = [
  {
    id: 'part-satria',
    participantCode: 'PT-2601',
    fullName: 'Satria Raziq Hamizan',
    studyProgram: 'Kehutanan',
    photo: MEDIA_ASSETS.satriaPortrait,
    eventId: 'evt-planting-tomorrow',
    personalMessage:
      'Saya menanam pohon Tabebuya ini dengan harapan generasi mendatang tetap bisa menikmati udara sejuk dan kota yang lebih hijau.',
    createdAt: '2026-11-19T07:30:00Z',
  },
  {
    id: 'part-nadia',
    participantCode: 'PT-2602',
    fullName: 'Nadia Putri Lestari',
    studyProgram: 'Ilmu Lingkungan',
    photo: MEDIA_ASSETS.nadiaPortrait,
    eventId: 'evt-coastal-canopy',
    personalMessage: '',
    createdAt: '2026-11-19T08:15:00Z',
  },
];

export const SEED_PLANT_RECORDS: PlantRecord[] = [
  {
    id: 'rec-sb26-0001',
    participantId: 'part-satria',
    plantId: 'plant-tabebuya',
    plantIdCode: 'SB26-0001',
    plantingDate: '19 November 2026',
    location: 'Zona Resapan Blok C, Tahura Ir. H. Djuanda, Bandung',
    cardFrontPhoto: MEDIA_ASSETS.satriaPortrait,
    plantPhoto: MEDIA_ASSETS.growthSapling,
    participantPlantPhoto: MEDIA_ASSETS.satriaPortrait,
    beginningTitle: 'Semua Berawal dari Satu Benih.',
    beginningDescription:
      'Pukul 07.45 WIB di lereng selatan Blok C, bibit Tabebuya setinggi 55 cm ini ditanam ke dalam tanah humus gembur bersama kompos organik dan penanda kayu bernomor SB26-0001.',
    templateId: 'forest',
    status: 'Published',
    createdAt: '2026-11-19T08:00:00Z',
  },
  {
    id: 'rec-sb26-0002',
    participantId: 'part-nadia',
    plantId: 'plant-ketapang',
    plantIdCode: 'SB26-0002',
    plantingDate: '14 Desember 2026',
    location: 'Koridor Pesisir Marunda, Jakarta Utara',
    cardFrontPhoto: MEDIA_ASSETS.nadiaPortrait,
    plantPhoto: '',
    participantPlantPhoto: '',
    beginningTitle: 'Semua Berawal dari Satu Benih.',
    beginningDescription:
      'Perjalanan tanaman ini telah terhubung dengan Plant ID SB26-0002. Dokumentasi foto Hari H dapat langsung diisi oleh peserta atau admin saat penanaman berlangsung.',
    templateId: 'botanical',
    status: 'Published',
    createdAt: '2026-11-19T08:40:00Z',
  },
];

export const SEED_GROWTH_UPDATES: GrowthUpdate[] = [
  {
    id: 'upd-001-day01',
    plantRecordId: 'rec-sb26-0001',
    dayLabel: 'Day 01',
    updateDate: '2026-11-19',
    photo: MEDIA_ASSETS.growthSapling,
    title: 'The Beginning — Penanaman Perdana',
    description:
      'Bibit Tabebuya berhasil ditanam dengan tinggi awal 55 cm. Kondisi tanah lembap dan mulsa serasah kayu telah dipasang di sekeliling pangkal batang.',
    createdAt: '2026-11-19T09:00:00Z',
  },
  {
    id: 'upd-001-day30',
    plantRecordId: 'rec-sb26-0001',
    dayLabel: 'Day 30',
    updateDate: '2026-12-19',
    photo: MEDIA_ASSETS.tabebuyaMain,
    title: 'First Growth — Tunas Daun Baru Muncul',
    description:
      'Pemantauan bulan pertama menunjukkan adaptasi akar yang kuat. Empat pasang pucuk daun hijau muda muncul di ujung batang utama dengan tinggi mencapai 68 cm.',
    createdAt: '2026-12-19T09:00:00Z',
  },
];
