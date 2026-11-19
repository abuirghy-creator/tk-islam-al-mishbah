import {
  User,
  Teacher,
  Staff,
  Student,
  StudentAttendanceRecord,
  TeacherAttendanceRecord,
  HalaqohAssessment,
  SppInvoice,
  ChatMessage,
  ChatGroup,
  Announcement,
  GalleryItem,
  AppNotification,
  HalaqohGroupInfo,
  LeaveRequest
} from '../types';
import { SCHOOL_ASSETS } from '../assets/images';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-owner',
    username: 'pemilik.akun',
    password: 'password123',
    name: 'Drs. H. Abdullah Mansyur',
    role: 'owner',
    isOwner: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    email: 'abdullah.mansyur@tk-almishbah.sch.id',
    phone: '0811-2233-4455',
    position: 'Pemilik Akun & Pembina Yayasan Al Mishbah'
  },
  {
    id: 'user-kepsek',
    username: 'kepala.sekolah',
    password: 'password123',
    name: 'Hj. Siti Khadijah, M.Pd.I',
    role: 'kepala_sekolah',
    isPrincipal: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    email: 'kepsek@tk-almishbah.sch.id',
    phone: '0812-9876-5432',
    position: 'Kepala Sekolah TK Islam Al Mishbah'
  },
  {
    id: 'user-guru-1',
    username: 'ustadzah.fatimah',
    password: 'password123',
    name: 'Ustadzah Fatimah Azzahra, S.Pd.I',
    role: 'guru',
    relatedTeacherId: 'tch-1',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    email: 'fatimah@tk-almishbah.sch.id',
    phone: '0812-3456-7890',
    position: 'Wali Kelas TK A-1 (Bintang Kejora)'
  },
  {
    id: 'user-guru-2',
    username: 'ustadz.ahmad',
    password: 'password123',
    name: 'Ustadz Ahmad Fauzi, S.Q',
    role: 'guru',
    relatedTeacherId: 'tch-2',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    email: 'ahmad.fauzi@tk-almishbah.sch.id',
    phone: '0813-8899-1122',
    position: 'Pembimbing Halaqoh & Koordinator Tahfidz'
  },
  {
    id: 'user-guru-3',
    username: 'ustadzah.nurul',
    password: 'password123',
    name: 'Ustadzah Nurul Hidayah, S.Pd',
    role: 'guru',
    relatedTeacherId: 'tch-3',
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80',
    email: 'nurul@tk-almishbah.sch.id',
    phone: '0819-2233-4455',
    position: 'Wali Kelas TK B-1 (Cahaya Al-Quran)'
  },
  {
    id: 'user-guru-4',
    username: 'ustadzah.anisa',
    password: 'password123',
    name: 'Ustadzah Anisa Maharani, S.Pd',
    role: 'guru',
    relatedTeacherId: 'tch-4',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    email: 'anisa@tk-almishbah.sch.id',
    phone: '0857-1122-3344',
    position: 'Guru Sentra Balok & Angklung'
  },
  {
    id: 'user-pegawai-1',
    username: 'admin.tu',
    password: 'password123',
    name: 'Bunda Siti Rahmawati, S.E',
    role: 'pegawai',
    relatedStaffId: 'stf-1',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    email: 'tu@tk-almishbah.sch.id',
    phone: '0815-4433-2211',
    position: 'Staff Tata Usaha'
  },
  {
    id: 'user-pegawai-2',
    username: 'hendra.keuangan',
    password: 'password123',
    name: 'Pak Hendra Pratama, A.Md',
    role: 'pegawai',
    relatedStaffId: 'stf-2',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    email: 'hendra@tk-almishbah.sch.id',
    phone: '0812-9988-1122',
    position: 'Karyawan Keuangan & SPP'
  },
  {
    id: 'user-pegawai-3',
    username: 'suparman.keamanan',
    password: 'password123',
    name: 'Pak Suparman',
    role: 'pegawai',
    relatedStaffId: 'stf-3',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    email: 'suparman@tk-almishbah.sch.id',
    phone: '0878-5544-3322',
    position: 'Karyawan Keamanan'
  },
  {
    id: 'user-ortu-1',
    username: 'ortu.rayyan',
    password: 'password123',
    name: 'Bpk. Irfan Hakim (Ayah M. Rayyan)',
    role: 'ortu',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    email: 'irfan.hakim@gmail.com',
    phone: '0812-7766-5544',
    relatedStudentId: 'TK-AM-202401'
  },
  {
    id: 'user-ortu-2',
    username: 'ortu.aisyah',
    password: 'password123',
    name: 'Ibu Wardah Maulida (Bunda Aisyah)',
    role: 'ortu',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    email: 'wardah.m@gmail.com',
    phone: '0818-6655-4433',
    relatedStudentId: 'TK-AM-202402'
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-1',
    nuptk: '19880415-201501-2-001',
    name: 'Ustadzah Fatimah Azzahra, S.Pd.I',
    gender: 'P',
    position: 'Wali Kelas TK A-1 (Bintang Kejora)',
    assignedDuty: 'Wali Kelas',
    phone: '0812-3456-7890',
    email: 'fatimah@tk-almishbah.sch.id',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    teachingSubjects: ['Halaqoh Tahfidz Pagi', 'Sentra Bahan Alam', 'Karakter Qur\'ani'],
    scheduleToday: [
      '07.15 - Sambut Siswa di Gerbang Berkah',
      '07.30 - Ikrar Pagi & Doa Belajar',
      '08.15 - Halaqoh Tahfidz Surat Pendek',
      '09.30 - Sentra Bahan Alam & Kreativitas',
      '10.45 - Muroja\'ah & Persiapan Pulang'
    ],
    status: 'Aktif'
  },
  {
    id: 'tch-2',
    nuptk: '19920820-201703-1-002',
    name: 'Ustadz Ahmad Fauzi, S.Q',
    gender: 'L',
    position: 'Pembimbing Halaqoh & Koordinator Tahfidz',
    assignedDuty: 'Pembimbing Halaqoh',
    phone: '0813-8899-1122',
    email: 'ahmad.fauzi@tk-almishbah.sch.id',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    teachingSubjects: ['Tahsin Tilawati', 'Makhorijul Huruf', 'Doa Harian & Hadits'],
    scheduleToday: [
      '07.30 - Senam Pagi & Sholat Dhuha Cilik',
      '08.15 - Halaqoh Makhraj Huruf TK B',
      '10.00 - Kisah 25 Nabi & Rasul'
    ],
    status: 'Aktif'
  },
  {
    id: 'tch-3',
    nuptk: '19901112-201602-2-003',
    name: 'Ustadzah Nurul Hidayah, S.Pd',
    gender: 'P',
    position: 'Wali Kelas TK B-1 (Cahaya Al-Quran)',
    assignedDuty: 'Wali Kelas',
    phone: '0819-2233-4455',
    email: 'nurul@tk-almishbah.sch.id',
    photoUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80',
    teachingSubjects: ['Sentra Persiapan Calistung Islami', 'Sains Cilik Islami'],
    scheduleToday: [
      '07.30 - Doa Bersama & Sholat Dhuha',
      '08.30 - Sentra Persiapan Membaca & Menulis',
      '10.00 - Eksplorasi Sains Air & Tumbuhan'
    ],
    status: 'Aktif'
  },
  {
    id: 'tch-4',
    nuptk: '19950508-202001-2-004',
    name: 'Ustadzah Anisa Maharani, S.Pd',
    gender: 'P',
    position: 'Guru Sentra Balok & Angklung',
    assignedDuty: 'Guru',
    phone: '0857-1122-3344',
    email: 'anisa@tk-almishbah.sch.id',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    teachingSubjects: ['Sentra Balok & Konstruksi', 'Seni Musik Angklung'],
    scheduleToday: [
      '08.00 - Sentra Balok & Mini Arsitektur',
      '09.45 - Sholawat & Lagu Anak Muslim'
    ],
    status: 'Izin'
  }
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'stf-1',
    nip: 'PEG-2018-001',
    name: 'Bunda Siti Rahmawati, S.E',
    department: 'Tata Usaha & Administrasi',
    position: 'Staff Tata Usaha',
    assignedDuty: 'Staff',
    phone: '0815-4433-2211',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    status: 'Aktif'
  },
  {
    id: 'stf-2',
    nip: 'PEG-2019-002',
    name: 'Pak Hendra Pratama, A.Md',
    department: 'Keuangan & Layanan SPP',
    position: 'Karyawan Keuangan & SPP',
    assignedDuty: 'Karyawan',
    phone: '0812-9988-1122',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    status: 'Aktif'
  },
  {
    id: 'stf-3',
    nip: 'PEG-2021-003',
    name: 'Pak Suparman',
    department: 'Koordinator Keamanan & Antar-Jemput',
    position: 'Karyawan Keamanan',
    assignedDuty: 'Karyawan',
    phone: '0878-5544-3322',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    status: 'Aktif'
  }
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-1',
    applicantType: 'teacher',
    applicantId: 'tch-4',
    applicantName: 'Ustadzah Anisa Maharani, S.Pd',
    applicantPosition: 'Guru',
    leaveType: 'Sakit',
    startDate: '2026-10-26',
    endDate: '2026-10-27',
    totalDays: 2,
    reason: 'Demam tinggi & radang tenggorokan, dianjurkan istirahat 2 hari oleh dokter Puskesmas.',
    doctorLetterUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    status: 'pending',
    submittedAt: '26 Oktober 2026 - 06:45 WIB'
  },
  {
    id: 'leave-2',
    applicantType: 'staff',
    applicantId: 'stf-3',
    applicantName: 'Pak Suparman',
    applicantPosition: 'Karyawan',
    leaveType: 'Cuti',
    startDate: '2026-10-28',
    endDate: '2026-10-29',
    totalDays: 2,
    reason: 'Keperluan keluarga penting di luar kota (menghadiri pernikahan adik kandung).',
    status: 'pending',
    submittedAt: '25 Oktober 2026 - 15:30 WIB'
  },
  {
    id: 'leave-3',
    applicantType: 'teacher',
    applicantId: 'tch-2',
    applicantName: 'Ustadz Ahmad Fauzi, S.Q',
    applicantPosition: 'Pembimbing Halaqoh',
    leaveType: 'Izin',
    startDate: '2026-10-22',
    endDate: '2026-10-22',
    totalDays: 1,
    reason: 'Menghadiri wisuda akbar tahfidz quran anak mewakili sekolah.',
    status: 'approved',
    submittedAt: '21 Oktober 2026 - 08:00 WIB',
    reviewedAt: '21 Oktober 2026 - 09:15 WIB',
    reviewedBy: 'Hj. Siti Khadijah, M.Pd.I (Kepala Sekolah)',
    reviewNotes: 'Disetujui dan di-ACC. Tugas tahfidz pagi dikoordinasikan dengan Ustadzah Nurul.'
  }
];

export const INITIAL_HALAQOH_GROUPS: HalaqohGroupInfo[] = [
  {
    id: 'hlq-grp-1',
    name: 'Halaqoh 1 - Bintang (Juz Amma Awal)',
    shortName: 'Halaqoh 1 - Bintang',
    mentorName: 'Ustadzah Fatimah Azzahra, S.Pd.I',
    mentorPhone: '0812-3456-7890',
    focus: 'Surah An-Nas s/d Al-Fil, Doa Sehari-hari & Karakter Qur\'ani',
    targetLevel: 'Juz Amma Awal',
    room: 'Masjid Al-Mishbah Lantai 1 (Sayap Kanan)',
    scheduleTime: '08.00 - 09.15 WIB',
    color: 'emerald'
  },
  {
    id: 'hlq-grp-2',
    name: 'Halaqoh 2 - Cahaya (Tahfidz Juz 30)',
    shortName: 'Halaqoh 2 - Cahaya',
    mentorName: 'Ustadz Ahmad Fauzi, S.Q',
    mentorPhone: '0813-8899-1122',
    focus: 'Penguatan Tahfidz Juz 30 (Al-Humazah s/d An-Naba) & Makhraj Huruf',
    targetLevel: 'Tahfidz Juz 30',
    room: 'Ruang Tahfidz Baitul Maqdis',
    scheduleTime: '08.00 - 09.15 WIB',
    color: 'amber'
  },
  {
    id: 'hlq-grp-3',
    name: 'Halaqoh 3 - Pelangi (Tilawati & Makhraj)',
    shortName: 'Halaqoh 3 - Pelangi',
    mentorName: 'Ustadzah Nurul Hidayah, S.Pd',
    mentorPhone: '0819-2233-4455',
    focus: 'Tahsin Tilawati Cilik, Pelafalan Huruf Hijaiyah & Dengung (Ghunnah)',
    targetLevel: 'Tilawati & Makhraj',
    room: 'Sentra Al-Qur\'an Ar-Raudhah',
    scheduleTime: '08.00 - 09.15 WIB',
    color: 'teal'
  },
  {
    id: 'hlq-grp-4',
    name: 'Halaqoh 4 - Mentari (Doa & Hadits Cilik)',
    shortName: 'Halaqoh 4 - Mentari',
    mentorName: 'Ustadzah Anisa Maharani, S.Pd',
    mentorPhone: '0857-1122-3344',
    focus: 'Hafalan 10 Hadits Pilihan, Adab Islami & Doa Aktivitas Harian',
    targetLevel: 'Doa & Hadits Cilik',
    room: 'Ruang Serba Guna Cordova',
    scheduleTime: '08.00 - 09.15 WIB',
    color: 'sky'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'TK-AM-202401',
    nisn: '0189234101',
    name: 'Muhammad Rayyan Al-Ghifari',
    nickName: 'Rayyan',
    gender: 'L',
    className: 'TK A-1',
    parentName: 'Irfan Hakim',
    parentPhone: '0812-7766-5544',
    parentEmail: 'irfan.hakim@gmail.com',
    address: 'Komplek Permata Hijau Blok C No. 4, Jakarta',
    photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80',
    birthDate: '2020-05-14',
    barcode: 'TK-AM-202401',
    halaqohGroup: 'Halaqoh 1 - Bintang (Juz Amma Awal)'
  },
  {
    id: 'TK-AM-202402',
    nisn: '0189234102',
    name: 'Aisyah Humaira Khansa',
    nickName: 'Aisyah',
    gender: 'P',
    className: 'TK A-1',
    parentName: 'Wardah Maulida',
    parentPhone: '0818-6655-4433',
    parentEmail: 'wardah.m@gmail.com',
    address: 'Jl. Melati Putih No. 19, Jakarta',
    photoUrl: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=300&q=80',
    birthDate: '2020-03-22',
    barcode: 'TK-AM-202402',
    halaqohGroup: 'Halaqoh 1 - Bintang (Juz Amma Awal)'
  },
  {
    id: 'TK-AM-202403',
    nisn: '0189234103',
    name: 'Fathir Zaidan Al-Farizi',
    nickName: 'Fathir',
    gender: 'L',
    className: 'TK A-1',
    parentName: 'Doni Prasetyo',
    parentPhone: '0813-1122-3377',
    parentEmail: 'doni.prasetyo@gmail.com',
    address: 'Jl. Kebon Jeruk Indah No. 8',
    photoUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=300&q=80',
    birthDate: '2020-08-11',
    barcode: 'TK-AM-202403',
    halaqohGroup: 'Halaqoh 1 - Bintang (Juz Amma Awal)'
  },
  {
    id: 'TK-AM-202404',
    nisn: '0189234104',
    name: 'Maryam Zahira Lubna',
    nickName: 'Maryam',
    gender: 'P',
    className: 'TK A-1',
    parentName: 'Fajar Nugraha',
    parentPhone: '0812-4455-6677',
    parentEmail: 'fajar.nugraha@gmail.com',
    address: 'Cluster Anggrek No. 12',
    photoUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=300&q=80',
    birthDate: '2020-06-03',
    barcode: 'TK-AM-202404',
    halaqohGroup: 'Halaqoh 1 - Bintang (Juz Amma Awal)'
  },
  {
    id: 'TK-AM-202405',
    nisn: '0178345201',
    name: 'Kenzo Althafandra Pratama',
    nickName: 'Kenzo',
    gender: 'L',
    className: 'TK B-1',
    parentName: 'Bambang Pratama',
    parentPhone: '0811-9876-5432',
    address: 'Perumahan Pesona Indah Blok D-7',
    photoUrl: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=300&q=80',
    birthDate: '2019-10-15',
    barcode: 'TK-AM-202405',
    halaqohGroup: 'Halaqoh 2 - Cahaya (Tahfidz Juz 30)'
  },
  {
    id: 'TK-AM-202406',
    nisn: '0178345202',
    name: 'Nabila Syakira Anandita',
    nickName: 'Nabila',
    gender: 'P',
    className: 'TK B-1',
    parentName: 'Dian Permana',
    parentPhone: '0813-7788-9900',
    address: 'Jl. Dahlia Raya No. 45',
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
    birthDate: '2019-12-01',
    barcode: 'TK-AM-202406',
    halaqohGroup: 'Halaqoh 2 - Cahaya (Tahfidz Juz 30)'
  },
  {
    id: 'TK-AM-202407',
    nisn: '0178345203',
    name: 'Ibrahim Malik Ar-Rasyid',
    nickName: 'Baim',
    gender: 'L',
    className: 'TK B-1',
    parentName: 'Taufiq Ar-Rasyid',
    parentPhone: '0812-6677-8899',
    address: 'Jl. Masjid Al-Ikhlas No. 2',
    photoUrl: 'https://images.unsplash.com/photo-1471286174890-9c112ffca564?auto=format&fit=crop&w=300&q=80',
    birthDate: '2019-09-09',
    barcode: 'TK-AM-202407',
    halaqohGroup: 'Halaqoh 2 - Cahaya (Tahfidz Juz 30)'
  },
  {
    id: 'TK-AM-202408',
    nisn: '0198456301',
    name: 'Zahra Shafiyyah Putri',
    nickName: 'Zahra',
    gender: 'P',
    className: 'Playgroup',
    parentName: 'Arif Wicaksono',
    parentPhone: '0815-9988-7711',
    address: 'Jl. Cempaka Baru No. 10',
    photoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=300&q=80',
    birthDate: '2021-04-18',
    barcode: 'TK-AM-202408',
    halaqohGroup: 'Halaqoh 4 - Mentari (Doa & Hadits Cilik)'
  }
];

const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_STUDENT_ATTENDANCE: StudentAttendanceRecord[] = [
  {
    id: 'att-s-1',
    date: todayStr,
    time: '07:18:20',
    studentId: 'TK-AM-202401',
    studentName: 'Muhammad Rayyan Al-Ghifari',
    className: 'TK A-1',
    status: 'Hadir',
    method: 'Barcode Scan',
    location: {
      lat: -6.229710,
      lng: 106.829520,
      distanceMeters: 18,
      inRadius: true
    }
  },
  {
    id: 'att-s-2',
    date: todayStr,
    time: '07:22:45',
    studentId: 'TK-AM-202402',
    studentName: 'Aisyah Humaira Khansa',
    className: 'TK A-1',
    status: 'Hadir',
    method: 'Barcode Scan',
    location: {
      lat: -6.229715,
      lng: 106.829505,
      distanceMeters: 22,
      inRadius: true
    }
  },
  {
    id: 'att-s-3',
    date: todayStr,
    time: '07:46:10',
    studentId: 'TK-AM-202403',
    studentName: 'Fathir Zaidan Al-Farizi',
    className: 'TK A-1',
    status: 'Terlambat',
    method: 'Manual Guru',
    notes: 'Terlambat 16 menit karena macet hujan pagi',
    location: {
      lat: -6.229730,
      lng: 106.829500,
      distanceMeters: 30,
      inRadius: true
    }
  },
  {
    id: 'att-s-4',
    date: todayStr,
    time: '07:15:00',
    studentId: 'TK-AM-202405',
    studentName: 'Kenzo Althafandra Pratama',
    className: 'TK B-1',
    status: 'Hadir',
    method: 'Barcode Scan',
    location: {
      lat: -6.229725,
      lng: 106.829515,
      distanceMeters: 12,
      inRadius: true
    }
  },
  {
    id: 'att-s-5',
    date: todayStr,
    time: '07:28:10',
    studentId: 'TK-AM-202406',
    studentName: 'Nabila Syakira Anandita',
    className: 'TK B-1',
    status: 'Hadir',
    method: 'Manual Guru',
    location: {
      lat: -6.229722,
      lng: 106.829510,
      distanceMeters: 15,
      inRadius: true
    }
  }
];

const buildInitialTeacherAttendance = (): TeacherAttendanceRecord[] => {
  const records: TeacherAttendanceRecord[] = [
    {
      id: 'att-t-1',
      date: todayStr,
      time: '07:05:12',
      teacherId: 'tch-1',
      teacherName: 'Ustadzah Fatimah Azzahra, S.Pd.I',
      selfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      status: 'Hadir Tepat Waktu',
      notes: 'Tiba pagi untuk piket penyambutan siswa di selasar utama',
      location: {
        lat: -6.229725,
        lng: 106.829512,
        accuracy: 8,
        distanceMeters: 14,
        inRadius: true,
        addressDescription: 'Gedung TK Al Mishbah - Area Gerbang Utama'
      }
    },
    {
      id: 'att-t-2',
      date: todayStr,
      time: '07:10:45',
      teacherId: 'tch-2',
      teacherName: 'Ustadz Ahmad Fauzi, S.Q',
      selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      status: 'Hadir Tepat Waktu',
      notes: 'Menyiapkan aula sholat dhuha dan mushaf tilawati',
      location: {
        lat: -6.229720,
        lng: 106.829518,
        accuracy: 6,
        distanceMeters: 20,
        inRadius: true,
        addressDescription: 'Gedung Aula Al Mishbah'
      }
    },
    {
      id: 'att-t-3',
      date: todayStr,
      time: '07:22:18',
      teacherId: 'tch-3',
      teacherName: 'Ustadzah Nurul Hidayah, S.Pd',
      selfieUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80',
      status: 'Hadir Tepat Waktu',
      notes: 'Menyiapkan kelas TK B-1 dan lembar calistung Islami',
      location: {
        lat: -6.229718,
        lng: 106.829508,
        accuracy: 7,
        distanceMeters: 16,
        inRadius: true,
        addressDescription: 'Ruang Kelas TK B-1 Al Mishbah'
      }
    },
    {
      id: 'att-t-4',
      date: todayStr,
      time: '07:00:00',
      teacherId: 'tch-4',
      teacherName: 'Ustadzah Anisa Maharani, S.Pd',
      selfieUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
      status: 'Izin',
      notes: 'Izin keperluan keluarga (ACC Kepala Sekolah)',
      location: {
        lat: -6.229728,
        lng: 106.829511,
        accuracy: 10,
        distanceMeters: 0,
        inRadius: true,
        addressDescription: 'Tercatat dari Perizinan Resmi'
      }
    },
    {
      id: 'att-s-stf-1',
      date: todayStr,
      time: '06:58:15',
      teacherId: 'stf-1',
      teacherName: 'Bunda Siti Rahmawati, S.E',
      selfieUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      status: 'Hadir Tepat Waktu',
      notes: 'Membuka layanan Tata Usaha & buku tamu administrasi pagi',
      location: {
        lat: -6.229722,
        lng: 106.829510,
        accuracy: 7,
        distanceMeters: 11,
        inRadius: true,
        addressDescription: 'Ruang Tata Usaha TK Islam Al Mishbah'
      }
    },
    {
      id: 'att-s-stf-2',
      date: todayStr,
      time: '07:14:30',
      teacherId: 'stf-2',
      teacherName: 'Pak Hendra Pratama, A.Md',
      selfieUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
      status: 'Hadir Tepat Waktu',
      notes: 'Rekonsiliasi transaksi pembayaran SPP & kas harian',
      location: {
        lat: -6.229719,
        lng: 106.829515,
        accuracy: 8,
        distanceMeters: 15,
        inRadius: true,
        addressDescription: 'Loket Keuangan & Layanan SPP'
      }
    },
    {
      id: 'att-s-stf-3',
      date: todayStr,
      time: '06:45:10',
      teacherId: 'stf-3',
      teacherName: 'Pak Suparman',
      selfieUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      status: 'Hadir Tepat Waktu',
      notes: 'Pengaturan lalu lintas pengantaran santri di gerbang depan',
      location: {
        lat: -6.229732,
        lng: 106.829504,
        accuracy: 6,
        distanceMeters: 6,
        inRadius: true,
        addressDescription: 'Pos Keamanan Gerbang Utama'
      }
    }
  ];

  // Generate historical school-day (Senin-Jumat) records across current & previous month
  const baseDate = new Date();
  let seq = 10;
  for (let offset = 1; offset <= 45; offset++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - offset);
    const day = d.getDay();
    if (day === 0 || day === 6) continue; // skip Minggu & Sabtu

    const dateStr = d.toISOString().split('T')[0];

    INITIAL_TEACHERS.forEach((teacher, tIdx) => {
      const seed = offset * 7 + tIdx * 3;
      let status: TeacherAttendanceRecord['status'] = 'Hadir Tepat Waktu';
      let time = `07:0${(seed % 9) + 1}:${String((seed * 7) % 50 + 10).padStart(2, '0')}`;
      let notes = 'Presensi masuk pagi & kegiatan belajar mengajar';

      if (seed % 19 === 0) {
        status = 'Sakit';
        time = '07:00:00';
        notes = 'Surat keterangan sakit (ACC Kepala Sekolah)';
      } else if (seed % 17 === 0) {
        status = 'Izin';
        time = '07:00:00';
        notes = 'Izin urusan keluarga mendesak (ACC Kepala Sekolah)';
      } else if (seed % 29 === 0) {
        status = 'Cuti';
        time = '07:00:00';
        notes = 'Cuti tahunan terjadwal (ACC Kepala Sekolah)';
      } else if (seed % 9 === 0) {
        status = 'Terlambat';
        time = `07:${34 + (seed % 15)}:${String((seed * 11) % 50 + 10).padStart(2, '0')}`;
        notes = 'Terlambat karena kendala lalu lintas pagi';
      } else if (seed % 2 === 0) {
        time = `07:1${seed % 9}:${String((seed * 5) % 50 + 10).padStart(2, '0')}`;
      }

      records.push({
        id: `att-t-hist-${seq++}`,
        date: dateStr,
        time,
        teacherId: teacher.id,
        teacherName: teacher.name,
        selfieUrl: teacher.photoUrl,
        status,
        notes,
        location: {
          lat: -6.22972 + (tIdx * 0.00001),
          lng: 106.82951 + (tIdx * 0.00001),
          accuracy: 8,
          distanceMeters: 12 + (seed % 25),
          inRadius: true,
          addressDescription: 'Kampus Utama TK Islam Al Mishbah'
        }
      });
    });

    INITIAL_STAFF.forEach((staffMember, sIdx) => {
      const seed = offset * 11 + sIdx * 5;
      let status: TeacherAttendanceRecord['status'] = 'Hadir Tepat Waktu';
      let time = `06:5${(seed % 9)}:${String((seed * 3) % 50 + 10).padStart(2, '0')}`;
      let notes = `Tugas operasional ${staffMember.department}`;

      if (seed % 23 === 0) {
        status = 'Sakit';
        time = '07:00:00';
        notes = 'Surat keterangan sakit (ACC Kepala Sekolah)';
      } else if (seed % 19 === 0) {
        status = 'Izin';
        time = '07:00:00';
        notes = 'Izin keperluan keluarga (ACC Kepala Sekolah)';
      } else if (seed % 31 === 0) {
        status = 'Cuti';
        time = '07:00:00';
        notes = 'Cuti terjadwal (ACC Kepala Sekolah)';
      } else if (seed % 13 === 0) {
        status = 'Terlambat';
        time = `07:${33 + (seed % 14)}:${String((seed * 7) % 50 + 10).padStart(2, '0')}`;
        notes = 'Terlambat tiba di area kerja';
      } else if (seed % 2 === 0) {
        time = `07:0${seed % 9}:${String((seed * 7) % 50 + 10).padStart(2, '0')}`;
      }

      records.push({
        id: `att-stf-hist-${seq++}`,
        date: dateStr,
        time,
        teacherId: staffMember.id,
        teacherName: staffMember.name,
        selfieUrl: staffMember.photoUrl,
        status,
        notes,
        location: {
          lat: -6.229725 + (sIdx * 0.00001),
          lng: 106.829512 + (sIdx * 0.00001),
          accuracy: 8,
          distanceMeters: 10 + (seed % 20),
          inRadius: true,
          addressDescription: `Unit ${staffMember.department}`
        }
      });
    });
  }

  return records;
};

export const INITIAL_TEACHER_ATTENDANCE: TeacherAttendanceRecord[] = buildInitialTeacherAttendance();

export const INITIAL_HALAQOH_ASSESSMENTS: HalaqohAssessment[] = [
  {
    id: 'hlq-1',
    date: todayStr,
    studentId: 'TK-AM-202401',
    studentName: 'Muhammad Rayyan Al-Ghifari',
    className: 'TK A-1',
    teacherName: 'Ustadzah Fatimah Azzahra, S.Pd.I',
    category: 'Tahfidz',
    surahOrJilid: 'Surah Al-Ikhlas (Ayat 1-4)',
    type: 'Tahfidz (Hafalan Baru)',
    kelancaranScore: 5,
    makhorijulHurufScore: 4,
    ahkamTajwidScore: 4,
    grade: 'Mumtaz (Istimewa)',
    teacherNote: 'Masya Allah! Hafalan Rayyan sangat percaya diri dan tartil. Perhatikan huruf Qolqolah pada kata "Ahad" & "As-Shamad" agar lebih mantap membal.',
    passed: true
  },
  {
    id: 'hlq-iqro-1',
    date: todayStr,
    studentId: 'TK-AM-202401',
    studentName: 'Muhammad Rayyan Al-Ghifari',
    className: 'TK A-1',
    teacherName: 'Ustadzah Fatimah Azzahra, S.Pd.I',
    category: 'Iqro',
    iqroJilid: 'Iqro Jilid 2',
    iqroPage: 'Halaman 14-15',
    surahOrJilid: 'Iqro Jilid 2 • Halaman 14-15',
    type: 'Membaca Iqro',
    kelancaranScore: 5,
    makhorijulHurufScore: 4,
    ahkamTajwidScore: 5,
    grade: 'Mumtaz (Istimewa)',
    teacherNote: 'Rayyan sudah lancar menyambung huruf berharakat fathah dan membedakan bacaan pendek-panjang. Siap lanjut ke halaman 16.',
    passed: true
  },
  {
    id: 'hlq-2',
    date: todayStr,
    studentId: 'TK-AM-202402',
    studentName: 'Aisyah Humaira Khansa',
    className: 'TK A-1',
    teacherName: 'Ustadzah Fatimah Azzahra, S.Pd.I',
    category: 'Tahfidz',
    surahOrJilid: 'Surah Al-Falaq (Ayat 1-5)',
    type: 'Muroja\'ah (Ulang Hafalan)',
    kelancaranScore: 5,
    makhorijulHurufScore: 5,
    ahkamTajwidScore: 5,
    grade: 'Mumtaz (Istimewa)',
    teacherNote: 'Alhamdulillah, hafalan sangat fasih dan makhraj huruf ha (ح) dan \'ayn (ع) sangat jelas. Siap lanjut ke Surah Al-Masad besok!',
    passed: true
  },
  {
    id: 'hlq-iqro-2',
    date: todayStr,
    studentId: 'TK-AM-202402',
    studentName: 'Aisyah Humaira Khansa',
    className: 'TK A-1',
    teacherName: 'Ustadzah Fatimah Azzahra, S.Pd.I',
    category: 'Iqro',
    iqroJilid: 'Iqro Jilid 3',
    iqroPage: 'Halaman 8-9',
    surahOrJilid: 'Iqro Jilid 3 • Halaman 8-9',
    type: 'Membaca Iqro',
    kelancaranScore: 5,
    makhorijulHurufScore: 5,
    ahkamTajwidScore: 4,
    grade: 'Mumtaz (Istimewa)',
    teacherNote: 'Bacaan kasroh dan mad thabi\'i ya sukun sudah sangat teliti dan tidak tergesa-gesa. Lanjut halaman 10!',
    passed: true
  },
  {
    id: 'hlq-3',
    date: todayStr,
    studentId: 'TK-AM-202403',
    studentName: 'Fathir Zaidan Al-Farizi',
    className: 'TK A-1',
    teacherName: 'Ustadzah Fatimah Azzahra, S.Pd.I',
    category: 'Tahfidz',
    surahOrJilid: 'Surah An-Nas (Ayat 1-6)',
    type: 'Muroja\'ah (Ulang Hafalan)',
    kelancaranScore: 4,
    makhorijulHurufScore: 4,
    ahkamTajwidScore: 3,
    grade: 'Jayyid Jiddan (Sangat Baik)',
    teacherNote: 'Alhamdulillah sudah hafal lengkap. Tingkatkan dengungan Ghunnah pada kata "Min syarril waswasil khannas". Diulang murojaah bersama bunda ya.',
    passed: true
  },
  {
    id: 'hlq-iqro-3',
    date: todayStr,
    studentId: 'TK-AM-202403',
    studentName: 'Fathir Zaidan Al-Farizi',
    className: 'TK A-1',
    teacherName: 'Ustadzah Fatimah Azzahra, S.Pd.I',
    category: 'Iqro',
    iqroJilid: 'Iqro Jilid 1',
    iqroPage: 'Halaman 24-25',
    surahOrJilid: 'Iqro Jilid 1 • Halaman 24-25',
    type: 'Membaca Iqro',
    kelancaranScore: 4,
    makhorijulHurufScore: 4,
    ahkamTajwidScore: 4,
    grade: 'Jayyid Jiddan (Sangat Baik)',
    teacherNote: 'Sudah mengenal huruf hijaiyah terpisah dengan baik. Perlu sedikit latihan membedakan huruf tsa (ث) dan sya (ش).',
    passed: true
  },
  {
    id: 'hlq-4',
    date: todayStr,
    studentId: 'TK-AM-202405',
    studentName: 'Kenzo Althafandra Pratama',
    className: 'TK B-1',
    teacherName: 'Ustadz Ahmad Fauzi, S.Q',
    category: 'Tahfidz',
    surahOrJilid: 'Surah At-Takatsur (Ayat 1-8)',
    type: 'Tahfidz (Hafalan Baru)',
    kelancaranScore: 5,
    makhorijulHurufScore: 4,
    ahkamTajwidScore: 4,
    grade: 'Jayyid Jiddan (Sangat Baik)',
    teacherNote: 'Alhamdulillah target juz 30 berjalan luar biasa! Suara lantang dan tajwid rapi.',
    passed: true
  },
  {
    id: 'hlq-iqro-4',
    date: todayStr,
    studentId: 'TK-AM-202405',
    studentName: 'Kenzo Althafandra Pratama',
    className: 'TK B-1',
    teacherName: 'Ustadz Ahmad Fauzi, S.Q',
    category: 'Iqro',
    iqroJilid: 'Iqro Jilid 4',
    iqroPage: 'Halaman 12-13',
    surahOrJilid: 'Iqro Jilid 4 • Halaman 12-13',
    type: 'Membaca Iqro',
    kelancaranScore: 5,
    makhorijulHurufScore: 4,
    ahkamTajwidScore: 4,
    grade: 'Jayyid Jiddan (Sangat Baik)',
    teacherNote: 'Lancar membaca tanwin dan qolqolah pada Iqro Jilid 4. Pertahankan ketenangan tempo membaca.',
    passed: true
  }
];

export const INITIAL_SPP_INVOICES: SppInvoice[] = [
  {
    id: 'INV-2026-10-01',
    studentId: 'TK-AM-202401',
    studentName: 'Muhammad Rayyan Al-Ghifari',
    className: 'TK A-1',
    monthYear: 'Oktober 2026',
    amount: 350000,
    category: 'SPP Bulanan',
    status: 'LUNAS',
    dueDate: '2026-10-10',
    paidDate: '2026-10-05 08:34 WIB',
    paymentMethod: 'Transfer BSI',
    transactionRef: 'BSI-TX9928174'
  },
  {
    id: 'INV-2026-10-02',
    studentId: 'TK-AM-202401',
    studentName: 'Muhammad Rayyan Al-Ghifari',
    className: 'TK A-1',
    monthYear: 'November 2026',
    amount: 350000,
    category: 'SPP Bulanan',
    status: 'BELUM DIBAYAR',
    dueDate: '2026-11-10'
  },
  {
    id: 'INV-2026-10-03',
    studentId: 'TK-AM-202401',
    studentName: 'Muhammad Rayyan Al-Ghifari',
    className: 'TK A-1',
    monthYear: 'Oktober 2026',
    amount: 150000,
    category: 'Uang Kegiatan & Outing',
    status: 'LUNAS',
    dueDate: '2026-10-15',
    paidDate: '2026-10-05 08:35 WIB',
    paymentMethod: 'QRIS',
    transactionRef: 'QRIS-OKT-7721'
  },
  {
    id: 'INV-2026-10-04',
    studentId: 'TK-AM-202402',
    studentName: 'Aisyah Humaira Khansa',
    className: 'TK A-1',
    monthYear: 'Oktober 2026',
    amount: 350000,
    category: 'SPP Bulanan',
    status: 'LUNAS',
    dueDate: '2026-10-10',
    paidDate: '2026-10-03 14:15 WIB',
    paymentMethod: 'Transfer BCA',
    transactionRef: 'BCA-8891024'
  },
  {
    id: 'INV-2026-10-05',
    studentId: 'TK-AM-202403',
    studentName: 'Fathir Zaidan Al-Farizi',
    className: 'TK A-1',
    monthYear: 'Oktober 2026',
    amount: 350000,
    category: 'SPP Bulanan',
    status: 'MENUNGGU VERIFIKASI',
    dueDate: '2026-10-10',
    paymentMethod: 'Transfer Mandiri',
    transactionRef: 'MDR-445566'
  }
];

export const INITIAL_CHAT_GROUPS: ChatGroup[] = [
  {
    id: 'group-tk-a1',
    name: 'Grup Kelas TK A-1 (Bintang Kejora)',
    description: 'Wadah silaturahmi & info harian wali murid kelas TK A-1 bersama Ustadzah Fatimah',
    memberCount: 16,
    icon: '🌟'
  },
  {
    id: 'group-tk-b1',
    name: 'Grup Kelas TK B-1 (Cahaya Al-Quran)',
    description: 'Info kegiatan, sentra persiapan, & halaqoh tahfidz TK B-1 bersama Ustadzah Nurul',
    memberCount: 18,
    icon: '📖'
  },
  {
    id: 'group-halaqoh',
    name: 'Halaqoh Tahfidz Cilik TK Al Mishbah',
    description: 'Forum konsultasi murojaah hafalan Al-Qur\'an bersama Koordinator Tahfidz Ustadz Ahmad',
    memberCount: 32,
    icon: '🕌'
  },
  {
    id: 'group-komite',
    name: 'Komite & Paguyuban Wali Murid',
    description: 'Diskusi program parenting, bakti sosial, dan pameran kreasi anak sholeh',
    memberCount: 28,
    icon: '🤝'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'user-guru-1',
    senderName: 'Ustadzah Fatimah Azzahra',
    senderRole: 'guru',
    senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    groupId: 'group-tk-a1',
    text: 'Assalamu\'alaikum Ayah & Bunda sholeh/sholehah. Mengingatkan besok anak-anak memakai seragam batik hijau dan membawa botol minum bertali yaa. Jazakumullahu khair! 🌿',
    timestamp: 'Kemarin 16:30'
  },
  {
    id: 'msg-2',
    senderId: 'user-ortu-1',
    senderName: 'Bpk. Irfan Hakim (Ayah Rayyan)',
    senderRole: 'ortu',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    groupId: 'group-tk-a1',
    text: 'Wa\'alaikumussalam Ustadzah Fatimah, siap noted. Rayyan sudah menyiapkan botol minum dan tasnya dari malam ini. Terimakasih infonya ustadzah 🙏',
    timestamp: 'Kemarin 16:45'
  },
  {
    id: 'msg-3',
    senderId: 'user-ortu-2',
    senderName: 'Ibu Wardah (Bunda Aisyah)',
    senderRole: 'ortu',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    groupId: 'group-tk-a1',
    text: 'Alhamdulillah, Aisyah tadi sore sudah muroja\'ah surah Al-Falaq dengan lancar. Besok insyaAllah siap setoran ya bu guru ✨',
    timestamp: 'Kemarin 17:10'
  },
  // Private message sample between Parent Rayyan and Teacher Fatimah
  {
    id: 'msg-priv-1',
    senderId: 'user-ortu-1',
    senderName: 'Bpk. Irfan Hakim',
    senderRole: 'ortu',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    recipientId: 'user-guru-1',
    text: 'Assalamu\'alaikum Ustadzah Fatimah, mau tanya untuk perkembangan hafalan Rayyan di surah Al-Ikhlas tadi pagi bagaimana ya ustadzah?',
    timestamp: 'Hari ini 09:15'
  },
  {
    id: 'msg-priv-2',
    senderId: 'user-guru-1',
    senderName: 'Ustadzah Fatimah Azzahra',
    senderRole: 'guru',
    senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    recipientId: 'user-ortu-1',
    text: 'Wa\'alaikumussalam Pak Irfan. Masya Allah Rayyan lancar sekali dan suaranya merdu lantang! Hanya perlu sedikit diperjelas huruf qolqolah di akhir ayat. Nilainya Mumtaz ⭐⭐⭐⭐⭐',
    timestamp: 'Hari ini 09:20'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Pelaksanaan Praktik Manasik Haji Cilik 1448 H',
    category: 'Kegiatan',
    date: '25 Oktober 2026',
    author: 'Kepala Sekolah TK Al Mishbah',
    content: 'Insya Allah pada hari Sabtu pekan depan, TK Al Mishbah akan menyelenggarakan simulasi Manasik Haji Cilik di pelataran Islamic Center. Seluruh santri mengenakan pakaian ihram putih. Mohon kehadiran ayah & bunda untuk mendampingi buah hati.',
    badgeColor: 'bg-emerald-100 text-emerald-800'
  },
  {
    id: 'ann-2',
    title: 'Pemeriksaan Kesehatan Gigi & Tumbuh Kembang dari Puskesmas',
    category: 'Penting',
    date: '22 Oktober 2026',
    author: 'UKS & Tata Usaha',
    content: 'Akan diadakan skrining kesehatan berkala meliputi kesehatan gigi, berat badan, tinggi badan, serta tes ketajaman penglihatan untuk seluruh kelompok bermain & TK.',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'ann-3',
    title: 'Pemberitahuan Batas Akhir Pembayaran SPP Bulan Ini',
    category: 'SPP & Keuangan',
    date: '18 Oktober 2026',
    author: 'Bagian Keuangan & SPP',
    content: 'Diimbau kepada wali murid yang belum menyelesaikan administrasi SPP bulan berjalan untuk melakukan pembayaran online melalui menu SPP di aplikasi (QRIS / BSI / BCA). Terima kasih atas kerjasamanya.',
    badgeColor: 'bg-amber-100 text-amber-800'
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Praktik Manasik Haji Cilik',
    description: 'Keceriaan anak-anak TK Al Mishbah mengenakan pakaian ihram mengelilingi miniatur Ka\'bah dengan doa talbiyah merdu.',
    date: '15 Oktober 2026',
    type: 'photo',
    mediaUrl: SCHOOL_ASSETS.manasik,
    category: 'Manasik Haji'
  },
  {
    id: 'gal-2',
    title: 'Halaqoh Tahfidz Al-Qur\'an Cilik',
    description: 'Suasana halaqoh pagi penuh kekhusyukan belajar makharijul huruf dan menghafal juz amma bersama ustadzah pembimbing.',
    date: '18 Oktober 2026',
    type: 'photo',
    mediaUrl: SCHOOL_ASSETS.tahfidz,
    category: 'Tahfidz'
  },
  {
    id: 'gal-3',
    title: 'Video Dokumentasi: Senam Ceria & Sholat Dhuha Berjamaah',
    description: 'Video keceriaan santri cilik saat senam pagi dilanjutkan praktik wudhu dan sholat Dhuha mandiri.',
    date: '20 Oktober 2026',
    type: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoDuration: '02:45',
    category: 'Kreativitas & Seni'
  },
  {
    id: 'gal-4',
    title: 'Pentas Seni Santri & Pameran Kaligrafi Warna-Warni',
    description: 'Ajang unjuk bakat santri dalam melantunkan nasyid islami, pidato cilik 3 bahasa, dan lukisan kaligrafi jari.',
    date: '08 Oktober 2026',
    type: 'photo',
    mediaUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    category: 'Pentas Siswa'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Peringatan Siswa Terlambat',
    message: 'Santri Fathir Zaidan Al-Farizi (TK A-1) tercatat tiba pukul 07:46 WIB (melebihi batas toleransi 07:30 WIB). Pesan notifikasi telah dikirimkan ke wali murid.',
    timestamp: '07:47 WIB Hari ini',
    type: 'warning',
    forRole: 'all',
    read: false,
    linkTab: 'student-att'
  },
  {
    id: 'notif-2',
    title: 'Pengingat Jadwal Mengajar Guru',
    message: 'Ustadzah Fatimah: Pukul 08:15 WIB adalah jadwal Halaqoh Tahfidz Sentra Qur\'ani di Ruang Bintang.',
    timestamp: '08:00 WIB Hari ini',
    type: 'info',
    forRole: 'guru',
    read: false,
    linkTab: 'halaqoh'
  },
  {
    id: 'notif-3',
    title: 'Penilaian Hafalan Baru Selesai',
    message: 'Ustadzah Fatimah telah memberikan penilaian setoran Surah Al-Ikhlas untuk M. Rayyan dengan predikat Mumtaz (⭐⭐⭐⭐⭐).',
    timestamp: '08:40 WIB Hari ini',
    type: 'success',
    forRole: 'ortu',
    read: false,
    linkTab: 'halaqoh'
  },
  {
    id: 'notif-4',
    title: 'Pembayaran SPP Telah Diterima',
    message: 'Pembayaran SPP Bulan Oktober untuk santri M. Rayyan Al-Ghifari telah berhasil diverifikasi oleh Bagian Keuangan.',
    timestamp: '08:45 WIB Kemarin',
    type: 'success',
    forRole: 'ortu',
    read: true,
    linkTab: 'spp'
  }
];
