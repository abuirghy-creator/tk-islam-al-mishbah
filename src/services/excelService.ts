import { StudentAttendanceRecord, Student } from '../types';

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
