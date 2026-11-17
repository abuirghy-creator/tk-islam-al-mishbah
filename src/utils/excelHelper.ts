import * as XLSX from 'xlsx';
import { Student, Teacher } from '../types';

export interface ParsedStudentRow {
  name: string;
  nickName: string;
  nisn: string;
  gender: 'L' | 'P';
  className: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  birthDate: string;
  halaqohGroup: string;
  photoUrl?: string;
  isValid: boolean;
  validationError?: string;
}

export interface ParsedTeacherRow {
  name: string;
  nuptk: string;
  gender: 'L' | 'P';
  position: string;
  phone: string;
  email: string;
  teachingSubjects: string[];
  status: 'Aktif' | 'Cuti' | 'Izin';
  photoUrl?: string;
  isValid: boolean;
  validationError?: string;
}

// Normalized header lookup
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Parses raw Excel / CSV file into structured Student rows
 */
export async function parseStudentExcelFile(file: File): Promise<ParsedStudentRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawRows.map((row, index) => {
    // Find matching keys flexibly
    const rowKeys = Object.keys(row);
    const getVal = (possibleKeys: string[]): string => {
      const normalizedPossibles = possibleKeys.map(normalizeKey);
      for (const k of rowKeys) {
        if (normalizedPossibles.includes(normalizeKey(k))) {
          const v = row[k];
          return v !== undefined && v !== null ? String(v).trim() : '';
        }
      }
      return '';
    };

    const name = getVal(['nama', 'namalengkap', 'namasantri', 'namamurid', 'murid', 'siswa']);
    let nickName = getVal(['namapanggilan', 'panggilan', 'alias']);
    if (!nickName && name) {
      nickName = name.split(' ')[0];
    }

    let nisn = getVal(['nisn', 'nis', 'noinduk', 'nomorinduk', 'id']);
    if (!nisn) {
      nisn = `0189${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const rawGender = getVal(['jeniskelamin', 'jk', 'gender', 'kelamin', 'sex']).toUpperCase();
    const gender: 'L' | 'P' = rawGender.startsWith('P') || rawGender === 'PEREMPUAN' || rawGender === 'F' ? 'P' : 'L';

    let className = getVal(['kelas', 'rombel', 'tingkat', 'kelompok']);
    if (!className) {
      className = 'TK A-1';
    }

    let parentName = getVal(['namaorangtua', 'orangtua', 'wali', 'namawali', 'ayah', 'ibu', 'namaayah', 'namaibu']);
    if (!parentName) {
      parentName = `Wali dari ${nickName || name || 'Santri'}`;
    }

    let parentPhone = getVal(['nohp', 'notelepon', 'hp', 'wa', 'whatsapp', 'kontak', 'nohportu', 'telepon']);
    if (!parentPhone) {
      parentPhone = '0812-0000-0000';
    }

    const parentEmail = getVal(['email', 'emailortu', 'surel']);

    let address = getVal(['alamat', 'domisili', 'tempattinggal', 'alamatrumah']);
    if (!address) {
      address = 'Cilebut, Bogor';
    }

    let birthDate = getVal(['tanggallahir', 'tgllahir', 'tgllahiryyyy-mm-dd', 'dob', 'birthdate']);
    if (!birthDate) {
      birthDate = '2020-05-15';
    } else if (typeof birthDate === 'number' || /^\d{5}$/.test(birthDate)) {
      // Excel serial date number
      try {
        const parsedDate = new Date(Math.round((Number(birthDate) - 25569) * 86400 * 1000));
        birthDate = parsedDate.toISOString().split('T')[0];
      } catch {
        birthDate = '2020-05-15';
      }
    }

    let halaqohRaw = getVal([
      'halaqoh',
      'kelompokhalaqoh',
      'kelompokhalaqohkelas',
      'halaqohgroup',
      'kelompokmengaji',
      'gruptahfidz',
      'tahfidz',
      'kelompokquran'
    ]);
    let halaqohGroup = '';
    const halaqohLower = halaqohRaw.toLowerCase();

    if (halaqohLower.includes('bintang') || halaqohLower.includes('fatimah') || halaqohLower === 'halaqoh 1' || halaqohLower.includes('juz amma awal')) {
      halaqohGroup = 'Halaqoh 1 - Bintang (Juz Amma Awal)';
    } else if (halaqohLower.includes('cahaya') || halaqohLower.includes('ahmad') || halaqohLower === 'halaqoh 2' || halaqohLower.includes('juz 30')) {
      halaqohGroup = 'Halaqoh 2 - Cahaya (Tahfidz Juz 30)';
    } else if (halaqohLower.includes('pelangi') || halaqohLower.includes('nurul') || halaqohLower === 'halaqoh 3' || halaqohLower.includes('tilawati') || halaqohLower.includes('makhraj')) {
      halaqohGroup = 'Halaqoh 3 - Pelangi (Tilawati & Makhraj)';
    } else if (halaqohLower.includes('mentari') || halaqohLower.includes('anisa') || halaqohLower === 'halaqoh 4' || halaqohLower.includes('hadits') || halaqohLower.includes('doa')) {
      halaqohGroup = 'Halaqoh 4 - Mentari (Doa & Hadits Cilik)';
    } else if (halaqohRaw.trim()) {
      halaqohGroup = halaqohRaw.trim();
    } else {
      // Smart default based on class
      if (className.includes('TK B')) {
        halaqohGroup = 'Halaqoh 2 - Cahaya (Tahfidz Juz 30)';
      } else if (className.includes('Playgroup')) {
        halaqohGroup = 'Halaqoh 4 - Mentari (Doa & Hadits Cilik)';
      } else {
        halaqohGroup = 'Halaqoh 1 - Bintang (Juz Amma Awal)';
      }
    }

    // Default avatars
    const defaultPhoto = gender === 'P'
      ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80'
      : 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80';

    let isValid = true;
    let validationError = '';

    if (!name) {
      isValid = false;
      validationError = `Baris #${index + 2}: Kolom Nama Santri tidak boleh kosong.`;
    }

    return {
      name,
      nickName,
      nisn,
      gender,
      className,
      parentName,
      parentPhone,
      parentEmail: parentEmail || undefined,
      address,
      birthDate,
      halaqohGroup,
      photoUrl: defaultPhoto,
      isValid,
      validationError
    };
  });
}

/**
 * Parses raw Excel / CSV file into structured Teacher rows
 */
export async function parseTeacherExcelFile(file: File): Promise<ParsedTeacherRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawRows.map((row, index) => {
    const rowKeys = Object.keys(row);
    const getVal = (possibleKeys: string[]): string => {
      const normalizedPossibles = possibleKeys.map(normalizeKey);
      for (const k of rowKeys) {
        if (normalizedPossibles.includes(normalizeKey(k))) {
          const v = row[k];
          return v !== undefined && v !== null ? String(v).trim() : '';
        }
      }
      return '';
    };

    const name = getVal(['nama', 'namaguru', 'namalengkap', 'ustadz', 'ustadzah', 'pendidik']);
    let nuptk = getVal(['nuptk', 'nip', 'id', 'idguru', 'nomorinduk']);
    if (!nuptk) {
      nuptk = `9876${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    }

    const rawGender = getVal(['jeniskelamin', 'jk', 'gender']).toUpperCase();
    const gender: 'L' | 'P' = rawGender.startsWith('L') || rawGender === 'LAKI-LAKI' || rawGender === 'M' ? 'L' : 'P';

    let position = getVal(['jabatan', 'posisi', 'tugas', 'walikelas', 'peran']);
    if (!position) {
      position = 'Guru Pengampu & Halaqoh Tahfidz';
    }

    let phone = getVal(['nohp', 'notelepon', 'hp', 'wa', 'whatsapp', 'telepon']);
    if (!phone) {
      phone = '0812-9988-0000';
    }

    let email = getVal(['email', 'surel']);
    if (!email && name) {
      const cleanName = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
      email = `${cleanName}@tk-almishbah.sch.id`;
    }

    const subjectsStr = getVal(['matapelajaran', 'mapel', 'bidangajar', 'pengampu', 'subjek']);
    let teachingSubjects: string[] = ['Halaqoh Tahfidz & Murojaah', 'Pendidikan Karakter Islami'];
    if (subjectsStr) {
      teachingSubjects = subjectsStr.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    }

    const rawStatus = getVal(['status', 'keaktifan']).toLowerCase();
    let status: 'Aktif' | 'Cuti' | 'Izin' = 'Aktif';
    if (rawStatus.includes('cuti')) status = 'Cuti';
    else if (rawStatus.includes('izin')) status = 'Izin';

    const defaultPhoto = gender === 'P'
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';

    let isValid = true;
    let validationError = '';

    if (!name) {
      isValid = false;
      validationError = `Baris #${index + 2}: Kolom Nama Guru tidak boleh kosong.`;
    }

    return {
      name,
      nuptk,
      gender,
      position,
      phone,
      email: email || 'guru@tk-almishbah.sch.id',
      teachingSubjects,
      status,
      photoUrl: defaultPhoto,
      isValid,
      validationError
    };
  });
}

/**
 * Downloads a sample Excel template for Students
 */
export function downloadStudentExcelTemplate(): void {
  const templateData = [
    {
      'Nama Santri': 'Muhammad Rayhan Pratama',
      'Nama Panggilan': 'Rayhan',
      'NISN': '0189234561',
      'Jenis Kelamin (L/P)': 'L',
      'Kelas': 'TK A-1',
      'Kelompok Halaqoh': 'Halaqoh 1 - Bintang (Juz Amma Awal)',
      'Nama Orang Tua / Wali': 'Ahmad Syahputra',
      'No HP WhatsApp Ortu': '081298765431',
      'Alamat Rumah': 'Jl. Bukit Asri No. 12, Cilebut, Bogor',
      'Tanggal Lahir (YYYY-MM-DD)': '2020-04-12'
    },
    {
      'Nama Santri': 'Aisyah Humaira Az-Zahra',
      'Nama Panggilan': 'Aisyah',
      'NISN': '0189234562',
      'Jenis Kelamin (L/P)': 'P',
      'Kelas': 'TK A-2',
      'Kelompok Halaqoh': 'Halaqoh 1 - Bintang (Juz Amma Awal)',
      'Nama Orang Tua / Wali': 'Hendra Wijaya',
      'No HP WhatsApp Ortu': '081387654322',
      'Alamat Rumah': 'Perum Cilebut Residence Blok C No. 5',
      'Tanggal Lahir (YYYY-MM-DD)': '2020-08-20'
    },
    {
      'Nama Santri': 'Fatih Al-Ghifari',
      'Nama Panggilan': 'Fatih',
      'NISN': '0189234563',
      'Jenis Kelamin (L/P)': 'L',
      'Kelas': 'TK B-1',
      'Kelompok Halaqoh': 'Halaqoh 2 - Cahaya (Tahfidz Juz 30)',
      'Nama Orang Tua / Wali': 'Bambang Pamungkas',
      'No HP WhatsApp Ortu': '085712345678',
      'Alamat Rumah': 'Jl. Bojong Indah No. 8, Bogor',
      'Tanggal Lahir (YYYY-MM-DD)': '2019-11-05'
    },
    {
      'Nama Santri': 'Zahra Syabila Putri',
      'Nama Panggilan': 'Zahra',
      'NISN': '0189234564',
      'Jenis Kelamin (L/P)': 'P',
      'Kelas': 'TK B-2',
      'Kelompok Halaqoh': 'Halaqoh 3 - Pelangi (Tilawati & Makhraj)',
      'Nama Orang Tua / Wali': 'Rizky Firmansyah',
      'No HP WhatsApp Ortu': '081234567899',
      'Alamat Rumah': 'Jl. Raya Cilebut Barat No. 24, Bogor',
      'Tanggal Lahir (YYYY-MM-DD)': '2019-10-14'
    },
    {
      'Nama Santri': 'Kenzi Al-Bukhari',
      'Nama Panggilan': 'Kenzi',
      'NISN': '0189234565',
      'Jenis Kelamin (L/P)': 'L',
      'Kelas': 'Playgroup',
      'Kelompok Halaqoh': 'Halaqoh 4 - Mentari (Doa & Hadits Cilik)',
      'Nama Orang Tua / Wali': 'Deni Setiawan',
      'No HP WhatsApp Ortu': '087812345600',
      'Alamat Rumah': 'Perum Griya Kencana Asri Blok B-2',
      'Tanggal Lahir (YYYY-MM-DD)': '2021-03-10'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 30 }, // Nama Santri
    { wch: 15 }, // Panggilan
    { wch: 15 }, // NISN
    { wch: 18 }, // JK
    { wch: 14 }, // Kelas
    { wch: 36 }, // Kelompok Halaqoh
    { wch: 25 }, // Wali
    { wch: 20 }, // No HP
    { wch: 35 }, // Alamat
    { wch: 25 }  // Tgl Lahir
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Data_Santri');
  XLSX.writeFile(workbook, 'Template_Data_Santri_TK_AlMishbah.xlsx');
}

/**
 * Downloads a sample Excel template for Teachers
 */
export function downloadTeacherExcelTemplate(): void {
  const templateData = [
    {
      'Nama Guru': 'Ustadzah Fatimah Azzahra, S.Pd.I',
      'NUPTK': '9876543210987654',
      'Jenis Kelamin': 'P',
      'Jabatan': 'Wali Kelas TK A-1 & Koordinator Tahfidz',
      'No HP / WhatsApp': '081234567891',
      'Email': 'fatimah@tk-almishbah.sch.id',
      'Mata Pelajaran (pisahkan koma)': 'Halaqoh Tahfidz, Sentra Bahan Alam, Adab Islami',
      'Status': 'Aktif'
    },
    {
      'Nama Guru': 'Ustadz Ahmad Fauzi, S.Pd',
      'NUPTK': '8765432109876543',
      'Jenis Kelamin': 'L',
      'Jabatan': 'Guru Sentra Balok & Pembina Olahraga Sunnah',
      'No HP / WhatsApp': '081398765432',
      'Email': 'ahmad.fauzi@tk-almishbah.sch.id',
      'Mata Pelajaran (pisahkan koma)': 'Sentra Balok & Rancang Bangun, Memanah & Renang',
      'Status': 'Aktif'
    },
    {
      'Nama Guru': 'Ustadzah Maryam Salsabila, S.Pd',
      'NUPTK': '7654321098765432',
      'Jenis Kelamin': 'P',
      'Jabatan': 'Wali Kelas TK B-1 & Sentra Persiapan',
      'No HP / WhatsApp': '085712349876',
      'Email': 'maryam@tk-almishbah.sch.id',
      'Mata Pelajaran (pisahkan koma)': 'Sentra Persiapan & Calistung Ramah Anak, Tahfidz',
      'Status': 'Aktif'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  worksheet['!cols'] = [
    { wch: 32 }, // Nama
    { wch: 20 }, // NUPTK
    { wch: 14 }, // JK
    { wch: 35 }, // Jabatan
    { wch: 18 }, // No HP
    { wch: 28 }, // Email
    { wch: 45 }, // Mapel
    { wch: 12 }  // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Guru_AlMishbah');
  XLSX.writeFile(workbook, 'Template_Data_Guru_TK_AlMishbah.xlsx');
}

/**
 * Export current students list to Excel
 */
export function exportStudentsToExcel(students: Student[], schoolName: string = 'TK Islam Al Mishbah'): void {
  const exportData = students.map((s, idx) => ({
    'No': idx + 1,
    'ID Santri': s.id,
    'NISN': s.nisn,
    'Nama Lengkap': s.name,
    'Nama Panggilan': s.nickName,
    'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)',
    'Kelas / Rombel': s.className,
    'Nama Orang Tua / Wali': s.parentName,
    'No. HP Wali Murid': s.parentPhone,
    'Email Wali': s.parentEmail || '-',
    'Kelompok Halaqoh': s.halaqohGroup,
    'Tanggal Lahir': s.birthDate,
    'Alamat Lengkap': s.address
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 15 },
    { wch: 26 },
    { wch: 15 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 18 },
    { wch: 24 },
    { wch: 30 },
    { wch: 15 },
    { wch: 35 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Santri');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Data_Santri_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xlsx`);
}

/**
 * Export current teachers list to Excel
 */
export function exportTeachersToExcel(teachers: Teacher[], schoolName: string = 'TK Islam Al Mishbah'): void {
  const exportData = teachers.map((t, idx) => ({
    'No': idx + 1,
    'ID Guru': t.id,
    'NUPTK / NIP': t.nuptk,
    'Nama Lengkap': t.name,
    'Jenis Kelamin': t.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)',
    'Jabatan / Tugas': t.position,
    'No. Handphone / WA': t.phone,
    'Email Resmi': t.email,
    'Mata Pelajaran Pengampu': t.teachingSubjects.join(', '),
    'Status Keaktifan': t.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
    { wch: 16 },
    { wch: 35 },
    { wch: 20 },
    { wch: 28 },
    { wch: 45 },
    { wch: 14 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Guru');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Data_Guru_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xlsx`);
}
