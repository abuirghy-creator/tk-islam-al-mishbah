import { StudentAttendanceRecord, TeacherAttendanceRecord, Student, Teacher, Staff } from '../types';

export const exportDailyAttendanceExcel = (
  date: string,
  className: string,
  records: StudentAttendanceRecord[],
  students: Student[]
) => {
  const headers = [
    'No',
    'ID Siswa',
    'Nama Santri',
    'Kelas',
    'Tanggal',
    'Jam Presensi',
    'Status Kehadiran',
    'Metode Presensi',
    'Keterangan',
    'Jarak Lokasi (Meter)',
    'Status Geofence'
  ];

  const rows = records.map((rec, index) => {
    return [
      index + 1,
      `"${rec.studentId}"`,
      `"${rec.studentName}"`,
      `"${rec.className}"`,
      `"${rec.date}"`,
      `"${rec.time}"`,
      `"${rec.status}"`,
      `"${rec.method}"`,
      `"${rec.notes || '-'}"`,
      rec.location?.distanceMeters ?? '-',
      rec.location?.inRadius ? 'Di Dalam Sekolah' : 'Di Luar Sekolah'
    ];
  });

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel compatibility
    `LAPORAN PRESENSI HARIAN TK AL MISHBAH\n` +
    `Tanggal: ${date} | Kelas: ${className || 'Semua Kelas'}\n\n` +
    [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Presensi_TK_Al_Mishbah_${date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportMonthlyAttendanceExcel = (
  monthYear: string,
  className: string,
  students: Student[],
  records: StudentAttendanceRecord[]
) => {
  const headers = [
    'No',
    'NIS Santri',
    'Nama Santri',
    'Kelas',
    'Total Hadir',
    'Total Terlambat',
    'Total Izin',
    'Total Sakit',
    'Total Alpa',
    'Persentase Kehadiran (%)',
    'Kualifikasi'
  ];

  const rows = students.map((std, idx) => {
    const studentRecords = records.filter((r) => r.studentId === std.id);
    const hadir = studentRecords.filter((r) => r.status === 'Hadir').length;
    const terlambat = studentRecords.filter((r) => r.status === 'Terlambat').length;
    const izin = studentRecords.filter((r) => r.status === 'Izin').length;
    const sakit = studentRecords.filter((r) => r.status === 'Sakit').length;
    const alpa = studentRecords.filter((r) => r.status === 'Alpa').length;
    const totalDay = Math.max(studentRecords.length, 20);
    const percentage = Math.round(((hadir + terlambat) / (totalDay || 1)) * 100);

    return [
      idx + 1,
      `"${std.id}"`,
      `"${std.name}"`,
      `"${std.className}"`,
      hadir,
      terlambat,
      izin,
      sakit,
      alpa,
      `${Math.min(100, percentage)}%`,
      percentage >= 90 ? '"Sangat Baik"' : percentage >= 75 ? '"Cukup Baik"' : '"Perlu Perhatian"'
    ];
  });

  const csvContent =
    '\uFEFF' +
    `REKAPITULASI PRESENSI BULANAN TK AL MISHBAH\n` +
    `Bulan: ${monthYear} | Kelas: ${className || 'Semua Kelas'}\n\n` +
    [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Bulanan_TK_Al_Mishbah_${monthYear.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportDailyTeacherAttendanceExcel = (
  date: string,
  records: TeacherAttendanceRecord[],
  teachers: Teacher[],
  staffList: Staff[] = [],
  categoryLabel = 'Guru & Karyawan'
) => {
  const headers = [
    'No',
    'Kategori',
    'NUPTK / NIP',
    'Nama Pegawai',
    'Jabatan / Unit Kerja',
    'Tanggal',
    'Jam Masuk',
    'Jam Keluar',
    'Status Kehadiran',
    'Jarak GPS (Meter)',
    'Status Radius',
    'Keterangan'
  ];

  const personnel = [
    ...teachers.map((t) => ({
      id: t.id,
      category: 'Guru',
      code: t.nuptk || t.id,
      name: t.name,
      roleLabel: t.assignedDuty || t.position
    })),
    ...staffList.map((s) => ({
      id: s.id,
      category: 'Karyawan',
      code: s.nip || s.id,
      name: s.name,
      roleLabel: `${s.position} (${s.department})`
    }))
  ];

  const dayRecords = records.filter((r) => r.date === date);
  const rows = personnel.map((person, idx) => {
    const rec = dayRecords.find((r) => r.teacherId === person.id);
    return [
      idx + 1,
      `"${person.category}"`,
      `"${person.code}"`,
      `"${person.name}"`,
      `"${person.roleLabel}"`,
      `"${date}"`,
      `"${rec ? rec.time : '-'}"`,
      `"${rec?.checkOutTime ? rec.checkOutTime : '-'}"`,
      `"${rec ? rec.status : 'Belum Presensi'}"`,
      rec?.location?.distanceMeters ?? '-',
      rec?.location ? (rec.location.inRadius ? 'Dalam Radius Sekolah' : 'Di Luar Radius') : '-',
      `"${rec?.notes || '-'}"`
    ];
  });

  const csvContent =
    '\uFEFF' +
    `LAPORAN PRESENSI HARIAN ${categoryLabel.toUpperCase()} TK ISLAM AL MISHBAH\n` +
    `Tanggal: ${date} | Total Pegawai: ${personnel.length}\n\n` +
    [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Presensi_${categoryLabel.replace(/[^a-zA-Z0-9]+/g, '_')}_Harian_${date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportMonthlyTeacherAttendanceExcel = (
  monthLabel: string,
  yearMonthKey: string,
  teachers: Teacher[],
  records: TeacherAttendanceRecord[],
  staffList: Staff[] = [],
  categoryLabel = 'Guru & Karyawan'
) => {
  const headers = [
    'No',
    'Kategori',
    'NUPTK / NIP',
    'Nama Pegawai',
    'Jabatan / Unit Kerja',
    'Tepat Waktu',
    'Terlambat',
    'Izin',
    'Sakit',
    'Cuti',
    'Total Hari Tercatat',
    'Persentase Kehadiran (%)',
    'Predikat'
  ];

  const personnel = [
    ...teachers.map((t) => ({
      id: t.id,
      category: 'Guru',
      code: t.nuptk || t.id,
      name: t.name,
      roleLabel: t.assignedDuty || t.position
    })),
    ...staffList.map((s) => ({
      id: s.id,
      category: 'Karyawan',
      code: s.nip || s.id,
      name: s.name,
      roleLabel: `${s.position} (${s.department})`
    }))
  ];

  const monthRecords = yearMonthKey
    ? records.filter((r) => r.date.startsWith(yearMonthKey))
    : records;
  const personnelIds = new Set(personnel.map((p) => p.id));
  const filteredMonthRecords = monthRecords.filter((r) => personnelIds.has(r.teacherId));
  const activeDatesCount = new Set(filteredMonthRecords.map((r) => r.date)).size;

  const rows = personnel.map((person, idx) => {
    const pRecs = filteredMonthRecords.filter((r) => r.teacherId === person.id);
    const tepatWaktu = pRecs.filter((r) => r.status === 'Hadir Tepat Waktu').length;
    const terlambat = pRecs.filter((r) => r.status === 'Terlambat').length;
    const izin = pRecs.filter((r) => r.status === 'Izin').length;
    const sakit = pRecs.filter((r) => r.status === 'Sakit').length;
    const cuti = pRecs.filter((r) => r.status === 'Cuti').length;
    const denominator = Math.max(activeDatesCount, pRecs.length, 1);
    const pct = Math.min(100, Math.round(((tepatWaktu + terlambat) / denominator) * 100));

    return [
      idx + 1,
      `"${person.category}"`,
      `"${person.code}"`,
      `"${person.name}"`,
      `"${person.roleLabel}"`,
      tepatWaktu,
      terlambat,
      izin,
      sakit,
      cuti,
      pRecs.length,
      `${pct}%`,
      pct >= 90 ? '"Teladan"' : pct >= 75 ? '"Baik"' : '"Perlu Pembinaan"'
    ];
  });

  const csvContent =
    '\uFEFF' +
    `REKAPITULASI PRESENSI BULANAN ${categoryLabel.toUpperCase()} TK ISLAM AL MISHBAH\n` +
    `Periode: ${monthLabel} | Hari Efektif Tercatat: ${activeDatesCount}\n\n` +
    [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Presensi_${categoryLabel.replace(/[^a-zA-Z0-9]+/g, '_')}_Bulanan_${monthLabel.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
