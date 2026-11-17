export type UserRole = 'guru' | 'pegawai' | 'ortu' | 'admin' | 'kepala_sekolah' | 'owner';

export interface SchoolProfile {
  name: string;
  motto: string;
  logoUrl: string;
  npsn: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  foundationName?: string;
  schoolCoordinates: {
    lat: number;
    lng: number;
    radiusMeters: number;
    name: string;
  };
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  email?: string;
  phone?: string;
  isOwner?: boolean; // Pemilik Akun Yayasan / Lembaga
  isPrincipal?: boolean; // Kepala Sekolah
  relatedTeacherId?: string; // Link to Teacher record (e.g. 'tch-1')
  relatedStaffId?: string; // Link to Staff record (e.g. 'stf-1')
  relatedStudentId?: string; // For orang tua: student NISN they belong to
  position?: string; // For guru/pegawai: e.g. "Wali Kelas TK A-1", "Staf Tata Usaha"
}

export interface Student {
  id: string; // e.g. "TK-AM-2401"
  nisn: string;
  name: string;
  nickName: string;
  gender: 'L' | 'P';
  className: string; // 'TK A-1', 'TK A-2', 'TK B-1', 'TK B-2', 'Playgroup'
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  photoUrl: string;
  birthDate: string;
  barcode: string;
  halaqohGroup: string; // e.g. 'Halaqoh 1 - Bintang (Juz Amma Awal)'
}

export interface HalaqohGroupInfo {
  id: string;
  name: string; // e.g. 'Halaqoh 1 - Bintang (Juz Amma Awal)'
  shortName: string; // e.g. 'Halaqoh 1 - Bintang'
  mentorName: string; // e.g. 'Ustadzah Fatimah Azzahra, S.Pd.I'
  mentorPhone?: string;
  focus: string; // e.g. 'Surah An-Nas s/d Al-Fil & Karakter Qurani'
  targetLevel: string; // e.g. 'Juz Amma Awal'
  room: string; // e.g. 'Masjid Al-Mishbah Lantai 1'
  scheduleTime: string; // e.g. '08.00 - 09.15 WIB'
  color: 'emerald' | 'amber' | 'teal' | 'sky' | 'indigo' | 'rose';
}

export const STAFF_POSITIONS = [
  'Guru',
  'Wali Kelas',
  'Kepala Sekolah',
  'Karyawan',
  'Staff',
  'Pembimbing Halaqoh'
] as const;

export type StaffPosition = typeof STAFF_POSITIONS[number];

export interface Teacher {
  id: string;
  nuptk: string;
  name: string;
  gender: 'L' | 'P';
  position: string; // e.g. "Wali Kelas TK A-1", "Guru Sentra"
  assignedDuty?: StaffPosition; // 'Guru' | 'Wali Kelas' | 'Kepala Sekolah' | 'Karyawan' | 'Staff' | 'Pembimbing Halaqoh'
  phone: string;
  email: string;
  photoUrl: string;
  teachingSubjects: string[];
  scheduleToday?: string[];
  status: 'Aktif' | 'Cuti' | 'Izin';
}

export interface Staff {
  id: string;
  nip: string;
  name: string;
  department: string; // 'Tata Usaha', 'Keuangan & SPP', 'Keamanan', 'Kebersihan'
  position: string; // e.g. "Staff Tata Usaha", "Karyawan Keuangan"
  assignedDuty?: StaffPosition; // 'Guru' | 'Wali Kelas' | 'Kepala Sekolah' | 'Karyawan' | 'Staff' | 'Pembimbing Halaqoh'
  phone: string;
  photoUrl: string;
  status: 'Aktif' | 'Cuti';
}

export type LeaveType = 'Sakit' | 'Izin' | 'Cuti' | 'Lainnya';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  applicantType: 'teacher' | 'staff';
  applicantId: string;
  applicantName: string;
  applicantPosition: string; // e.g. "Wali Kelas", "Karyawan", "Guru"
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  doctorLetterUrl?: string; // Optional Surat Dokter / Bukti Pendukung
  status: LeaveStatus; // 'pending' | 'approved' | 'rejected'
  submittedAt: string; // DD MMMM YYYY - HH:mm WIB
  reviewedAt?: string;
  reviewedBy?: string; // "Hj. Siti Khadijah, M.Pd.I (Kepala Sekolah)"
  reviewNotes?: string;
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat';

export interface StudentAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  studentId: string;
  studentName: string;
  className: string;
  status: AttendanceStatus;
  method: 'Barcode Scan' | 'Manual Guru' | 'Kartu Siswa';
  notes?: string;
  location?: {
    lat: number;
    lng: number;
    distanceMeters: number;
    inRadius: boolean;
  };
}

export interface TeacherAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  teacherId: string;
  teacherName: string;
  selfieUrl: string;
  status: 'Hadir Tepat Waktu' | 'Terlambat' | 'Izin' | 'Sakit' | 'Cuti';
  notes?: string;
  location: {
    lat: number;
    lng: number;
    accuracy: number;
    distanceMeters: number;
    inRadius: boolean;
    addressDescription?: string;
  };
}

export type GradeLevel = 'Mumtaz (Istimewa)' | 'Jayyid Jiddan (Sangat Baik)' | 'Jayyid (Baik)' | 'Maqbul (Cukup)';

export interface HalaqohAssessment {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  className: string;
  teacherName: string;
  surahOrJilid: string; // e.g. "Surah An-Nas ayat 1-6" or "Iqro Jilid 2 Hal 15"
  type: 'Tahfidz (Hafalan Baru)' | 'Muroja\'ah (Ulang Hafalan)' | 'Tilawati/Iqro';
  kelancaranScore: number; // 1-5 stars
  makhorijulHurufScore: number; // 1-5 stars
  ahkamTajwidScore: number; // 1-5 stars
  grade: GradeLevel;
  teacherNote: string;
  parentFeedback?: string;
  passed: boolean;
}

export interface SppInvoice {
  id: string; // e.g. "INV-2024-10-01"
  studentId: string;
  studentName: string;
  className: string;
  monthYear: string; // e.g. "Oktober 2026"
  amount: number;
  category: 'SPP Bulanan' | 'Uang Kegiatan & Outing' | 'Catering & Snack Sehat' | 'Uang Pangkal/Gedung';
  status: 'LUNAS' | 'MENUNGGU VERIFIKASI' | 'BELUM DIBAYAR';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: 'QRIS' | 'Transfer BSI' | 'Transfer BCA' | 'Transfer Mandiri' | 'GoPay / e-Wallet';
  paymentProofUrl?: string;
  transactionRef?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  recipientId?: string; // If private message
  groupId?: string; // If group chat e.g. 'tk-a1', 'tk-b1', 'halaqoh', 'komite'
  text: string;
  timestamp: string;
  attachmentUrl?: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  icon: string;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'Penting' | 'Akademik' | 'Kegiatan' | 'SPP & Keuangan';
  date: string;
  author: string;
  content: string;
  badgeColor: string;
  imageUrl?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'photo' | 'video';
  mediaUrl: string;
  videoDuration?: string;
  category: 'Tahfidz' | 'Manasik Haji' | 'Kreativitas & Seni' | 'Outing Class' | 'Pentas Siswa';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  forRole: UserRole | 'all';
  read: boolean;
  linkTab?: string;
}
