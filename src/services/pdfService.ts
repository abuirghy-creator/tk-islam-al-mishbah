import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentAttendanceRecord, TeacherAttendanceRecord, Student, Teacher, Staff, HalaqohAssessment, SppInvoice } from '../types';
import { SCHOOL_ASSETS } from '../assets/images';

export const exportDailyAttendancePDF = (
  date: string,
  className: string,
  records: StudentAttendanceRecord[],
  students: Student[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header / Kop Surat Resmi TK Al Mishbah
  doc.setFillColor(5, 150, 105); // Emerald Green
  doc.rect(0, 0, 210, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text('TK ISLAM AL MISHBAH', 105, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(SCHOOL_ASSETS.schoolMotto, 105, 26, { align: 'center' });
  doc.text(`${SCHOOL_ASSETS.address} | Telp: ${SCHOOL_ASSETS.phone}`, 105, 31, { align: 'center' });
  doc.text(`${SCHOOL_ASSETS.npsn} | Email: ${SCHOOL_ASSETS.email}`, 105, 36, { align: 'center' });

  // Double horizontal divider
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.8);
  doc.line(15, 40, 195, 40);
  doc.setDrawColor(217, 119, 6); // Golden Amber
  doc.setLineWidth(0.3);
  doc.line(15, 41.5, 195, 41.5);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text('LAPORAN PRESENSI HARIAN SISWA', 105, 50, { align: 'center' });

  // Metadata block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Tanggal: ${date}`, 15, 58);
  doc.text(`Kelas / Rombel: ${className || 'Semua Kelas'}`, 15, 64);
  doc.text(`Dicetak Pada: ${new Date().toLocaleString('id-ID')}`, 130, 58);
  doc.text(`Status: Real-Time Sync DB Sekolah`, 130, 64);

  // Table Data
  const tableData = records.map((rec, index) => {
    const student = students.find((s) => s.id === rec.studentId);
    return [
      (index + 1).toString(),
      rec.studentId,
      rec.studentName,
      rec.className,
      rec.time,
      rec.status.toUpperCase(),
      rec.method,
      rec.notes || '-'
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [['No', 'ID / NIS', 'Nama Santri', 'Kelas', 'Jam', 'Status', 'Metode', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 26 },
      2: { cellWidth: 42 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 24 },
      6: { halign: 'center', cellWidth: 24 },
      7: { cellWidth: 'auto' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw;
        if (val === 'HADIR') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'TERLAMBAT') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'SAKIT' || val === 'IZIN') {
          data.cell.styles.textColor = [37, 99, 235];
        } else if (val === 'ALPA') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Calculate statistics
  const total = records.length;
  const hadir = records.filter((r) => r.status === 'Hadir').length;
  const terlambat = records.filter((r) => r.status === 'Terlambat').length;
  const izinSakit = records.filter((r) => r.status === 'Izin' || r.status === 'Sakit').length;
  const alpa = records.filter((r) => r.status === 'Alpa').length;

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Summary box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15, finalY, 180, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('REKAPITULASI PRESENSI:', 20, finalY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Total Terdata: ${total} Anak  |  Hadir: ${hadir}  |  Terlambat: ${terlambat}  |  Izin/Sakit: ${izinSakit}  |  Alpa: ${alpa}`,
    20,
    finalY + 13
  );

  // Signatures
  const signY = finalY + 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('Mengetahui,', 25, signY);
  doc.text('Kepala Sekolah TK Al Mishbah', 25, signY + 5);

  doc.text('Jakarta, ' + date, 140, signY);
  doc.text('Wali Kelas / Guru Piket', 140, signY + 5);

  // Stempel Digital Preview Note
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.5);
  doc.circle(48, signY + 20, 12);
  doc.setFontSize(6.5);
  doc.setTextColor(5, 150, 105);
  doc.text('TK AL MISHBAH', 48, signY + 19, { align: 'center' });
  doc.text('TERVERIFIKASI', 48, signY + 23, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text('( Hj. Siti Khadijah, M.Pd.I )', 25, signY + 34);
  doc.text('( Ustadzah Fatimah Azzahra, S.Pd.I )', 140, signY + 34);

  doc.save(`Laporan_Presensi_TK_Al_Mishbah_${date}.pdf`);
};

export const exportMonthlyAttendancePDF = (
  monthYear: string,
  className: string,
  students: Student[],
  records: StudentAttendanceRecord[]
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Header Bar
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 297, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text('TK ISLAM AL MISHBAH - REKAPITULASI PRESENSI BULANAN', 148.5, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Periode: ${monthYear}  |  Kelas: ${className || 'Semua Kelas'}  |  Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 148.5, 24, { align: 'center' });

  // Border line
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.line(15, 28, 282, 28);

  const tableData = students.map((std, idx) => {
    const studentRecords = records.filter((r) => r.studentId === std.id);
    const hadir = studentRecords.filter((r) => r.status === 'Hadir').length;
    const terlambat = studentRecords.filter((r) => r.status === 'Terlambat').length;
    const izin = studentRecords.filter((r) => r.status === 'Izin').length;
    const sakit = studentRecords.filter((r) => r.status === 'Sakit').length;
    const alpa = studentRecords.filter((r) => r.status === 'Alpa').length;
    const totalDay = Math.max(studentRecords.length, 20); // standard school days base
    const attendancePercentage = Math.round(((hadir + terlambat) / (totalDay || 1)) * 100);

    return [
      (idx + 1).toString(),
      std.id,
      std.name,
      std.className,
      hadir.toString(),
      terlambat.toString(),
      izin.toString(),
      sakit.toString(),
      alpa.toString(),
      `${Math.min(100, attendancePercentage)}%`,
      attendancePercentage >= 90 ? 'Sangat Baik' : attendancePercentage >= 75 ? 'Cukup Baik' : 'Perlu Perhatian'
    ];
  });

  autoTable(doc, {
    startY: 34,
    head: [['No', 'NIS', 'Nama Santri', 'Kelas', 'Hadir', 'Telat', 'Izin', 'Sakit', 'Alpa', '% Kehadiran', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 26 },
      2: { halign: 'left', cellWidth: 60 },
      3: { cellWidth: 22 },
      4: { cellWidth: 16 },
      5: { cellWidth: 16 },
      6: { cellWidth: 16 },
      7: { cellWidth: 16 },
      8: { cellWidth: 16 },
      9: { cellWidth: 24, fontStyle: 'bold' },
      10: { cellWidth: 32 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Signature in landscape
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('Mengetahui,', 30, finalY);
  doc.text('Kepala Sekolah TK Islam Al Mishbah', 30, finalY + 5);
  doc.text('( Hj. Siti Khadijah, M.Pd.I )', 30, finalY + 28);

  doc.text('Jakarta, ' + new Date().toLocaleDateString('id-ID'), 210, finalY);
  doc.text('Bagian Tata Usaha & Kesiswaan', 210, finalY + 5);
  doc.text('( Bunda Siti Rahmawati, S.E )', 210, finalY + 28);

  doc.save(`Rekap_Bulanan_TK_Al_Mishbah_${monthYear.replace(/\s+/g, '_')}.pdf`);
};

export const exportDailyTeacherAttendancePDF = (
  date: string,
  records: TeacherAttendanceRecord[],
  teachers: Teacher[],
  staffList: Staff[] = [],
  categoryLabel = 'Guru & Karyawan'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text('TK ISLAM AL MISHBAH', 105, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(SCHOOL_ASSETS.schoolMotto, 105, 26, { align: 'center' });
  doc.text(`${SCHOOL_ASSETS.address} | Telp: ${SCHOOL_ASSETS.phone}`, 105, 31, { align: 'center' });
  doc.text(`${SCHOOL_ASSETS.npsn} | Email: ${SCHOOL_ASSETS.email}`, 105, 36, { align: 'center' });

  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.8);
  doc.line(15, 40, 195, 40);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  doc.line(15, 41.5, 195, 41.5);

  const personnel = [
    ...teachers.map((t) => ({
      id: t.id,
      code: t.nuptk || t.id,
      name: t.name,
      category: 'Guru',
      roleLabel: t.assignedDuty || t.position
    })),
    ...staffList.map((s) => ({
      id: s.id,
      code: s.nip || s.id,
      name: s.name,
      category: 'Karyawan',
      roleLabel: `${s.position} (${s.department})`
    }))
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text(`LAPORAN PRESENSI HARIAN ${categoryLabel.toUpperCase()}`, 105, 50, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Tanggal: ${date}`, 15, 58);
  doc.text(`Total Pegawai (${categoryLabel}): ${personnel.length} Orang`, 15, 64);
  doc.text(`Dicetak Pada: ${new Date().toLocaleString('id-ID')}`, 125, 58);
  doc.text(`Status: Verifikasi Selfie & GPS Geofence`, 125, 64);

  const dayRecords = records.filter((r) => r.date === date);
  const personnelIds = new Set(personnel.map((p) => p.id));
  const personnelDayRecords = dayRecords.filter((r) => personnelIds.has(r.teacherId));

  const tableRows = personnel.map((person, idx) => {
    const rec = personnelDayRecords.find((r) => r.teacherId === person.id);
    return [
      (idx + 1).toString(),
      person.category,
      person.code,
      person.name,
      person.roleLabel,
      rec ? rec.time : '-',
      rec?.checkOutTime ? rec.checkOutTime : '-',
      rec ? rec.status.toUpperCase() : 'BELUM PRESENSI',
      rec?.location ? (rec.location.inRadius ? `Dalam (${rec.location.distanceMeters}m)` : `Luar (${rec.location.distanceMeters}m)`) : '-',
      rec?.notes || '-'
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [['No', 'Kategori', 'NUPTK / NIP', 'Nama Pegawai', 'Jabatan / Unit', 'Jam Masuk', 'Jam Keluar', 'Status', 'GPS', 'Keterangan']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7.2
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'center', cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 22 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 22 },
      8: { halign: 'center', cellWidth: 16 },
      9: { cellWidth: 'auto' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw || '');
        if (val === 'HADIR TEPAT WAKTU') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'TERLAMBAT') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'IZIN' || val === 'SAKIT' || val === 'CUTI') {
          data.cell.styles.textColor = [37, 99, 235];
        } else {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    }
  });

  const tepatWaktu = personnelDayRecords.filter((r) => r.status === 'Hadir Tepat Waktu').length;
  const terlambat = personnelDayRecords.filter((r) => r.status === 'Terlambat').length;
  const izinSakitCuti = personnelDayRecords.filter((r) => r.status === 'Izin' || r.status === 'Sakit' || r.status === 'Cuti').length;
  const recordedCount = personnel.filter((p) => personnelDayRecords.some((r) => r.teacherId === p.id)).length;
  const belum = Math.max(0, personnel.length - recordedCount);

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15, finalY, 180, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text(`REKAPITULASI PRESENSI HARIAN (${categoryLabel.toUpperCase()}):`, 20, finalY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Total: ${personnel.length}  |  Tepat Waktu: ${tepatWaktu}  |  Terlambat: ${terlambat}  |  Izin/Sakit/Cuti: ${izinSakitCuti}  |  Belum Presensi: ${belum}`,
    20,
    finalY + 13
  );

  const signY = finalY + 28;
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('Mengetahui,', 25, signY);
  doc.text('Kepala Sekolah TK Islam Al Mishbah', 25, signY + 5);
  doc.text(`Jakarta, ${date}`, 140, signY);
  doc.text('Tata Usaha & Kepegawaian', 140, signY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text('( Hj. Siti Khadijah, M.Pd.I )', 25, signY + 26);
  doc.text('( Bunda Siti Rahmawati, S.E )', 140, signY + 26);

  doc.save(`Laporan_Presensi_${categoryLabel.replace(/[^a-zA-Z0-9]+/g, '_')}_Harian_${date}.pdf`);
};

export const exportMonthlyTeacherAttendancePDF = (
  monthLabel: string,
  yearMonthKey: string,
  teachers: Teacher[],
  records: TeacherAttendanceRecord[],
  staffList: Staff[] = [],
  categoryLabel = 'Guru & Karyawan'
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const personnel = [
    ...teachers.map((t) => ({
      id: t.id,
      code: t.nuptk || t.id,
      name: t.name,
      category: 'Guru',
      roleLabel: t.assignedDuty || t.position
    })),
    ...staffList.map((s) => ({
      id: s.id,
      code: s.nip || s.id,
      name: s.name,
      category: 'Karyawan',
      roleLabel: `${s.position} (${s.department})`
    }))
  ];

  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 297, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text(`TK ISLAM AL MISHBAH - REKAPITULASI PRESENSI BULANAN ${categoryLabel.toUpperCase()}`, 148.5, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(75, 85, 99);
  doc.text(
    `Periode: ${monthLabel}  |  Kategori: ${categoryLabel} (${personnel.length} Orang)  |  Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
    148.5,
    24,
    { align: 'center' }
  );

  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.line(15, 28, 282, 28);

  const monthRecords = yearMonthKey
    ? records.filter((r) => r.date.startsWith(yearMonthKey))
    : records;
  const personnelIds = new Set(personnel.map((p) => p.id));
  const filteredMonthRecords = monthRecords.filter((r) => personnelIds.has(r.teacherId));
  const activeDatesCount = new Set(filteredMonthRecords.map((r) => r.date)).size;

  const tableData = personnel.map((person, idx) => {
    const pRecs = filteredMonthRecords.filter((r) => r.teacherId === person.id);
    const tepatWaktu = pRecs.filter((r) => r.status === 'Hadir Tepat Waktu').length;
    const terlambat = pRecs.filter((r) => r.status === 'Terlambat').length;
    const izin = pRecs.filter((r) => r.status === 'Izin').length;
    const sakit = pRecs.filter((r) => r.status === 'Sakit').length;
    const cuti = pRecs.filter((r) => r.status === 'Cuti').length;
    const denominator = Math.max(activeDatesCount, pRecs.length, 1);
    const pct = Math.min(100, Math.round(((tepatWaktu + terlambat) / denominator) * 100));

    return [
      (idx + 1).toString(),
      person.category,
      person.code,
      person.name,
      person.roleLabel,
      tepatWaktu.toString(),
      terlambat.toString(),
      izin.toString(),
      sakit.toString(),
      cuti.toString(),
      pRecs.length.toString(),
      `${pct}%`,
      pct >= 90 ? 'Teladan' : pct >= 75 ? 'Baik' : 'Perlu Pembinaan'
    ];
  });

  autoTable(doc, {
    startY: 34,
    head: [['No', 'Kategori', 'NUPTK / NIP', 'Nama Pegawai', 'Jabatan / Unit', 'Tepat Waktu', 'Terlambat', 'Izin', 'Sakit', 'Cuti', 'Total Hari', '% Hadir', 'Predikat']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7.5
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 9 },
      1: { cellWidth: 18 },
      2: { cellWidth: 25 },
      3: { halign: 'left', cellWidth: 46 },
      4: { halign: 'left', cellWidth: 34 },
      5: { cellWidth: 18 },
      6: { cellWidth: 17 },
      7: { cellWidth: 13 },
      8: { cellWidth: 13 },
      9: { cellWidth: 13 },
      10: { cellWidth: 16 },
      11: { cellWidth: 16, fontStyle: 'bold' },
      12: { cellWidth: 26 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('Mengetahui,', 30, finalY);
  doc.text('Kepala Sekolah TK Islam Al Mishbah', 30, finalY + 5);
  doc.text('( Hj. Siti Khadijah, M.Pd.I )', 30, finalY + 26);

  doc.text('Jakarta, ' + new Date().toLocaleDateString('id-ID'), 210, finalY);
  doc.text('Bagian Tata Usaha & Kepegawaian', 210, finalY + 5);
  doc.text('( Bunda Siti Rahmawati, S.E )', 210, finalY + 26);

  doc.save(`Rekap_Presensi_${categoryLabel.replace(/[^a-zA-Z0-9]+/g, '_')}_Bulanan_${monthLabel.replace(/\s+/g, '_')}.pdf`);
};

const formatScoreText = (score: number) => {
  const labels: Record<number, string> = {
    5: 'Mumtaz (Istimewa)',
    4: 'Jayyid Jiddan (Sangat Baik)',
    3: 'Jayyid (Baik)',
    2: 'Maqbul (Cukup)',
    1: 'Perlu Bimbingan'
  };
  const label = labels[score] || 'Baik';
  return `${score} / 5 (${label})`;
};

export const exportHalaqohReportPDF = (
  student: Student,
  tahfidzAssessment?: HalaqohAssessment,
  iqroAssessment?: HalaqohAssessment,
  allStudentAssessments: HalaqohAssessment[] = []
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const isIqroItem = (item: HalaqohAssessment) =>
    item.category === 'Iqro' || item.type === 'Membaca Iqro' || item.type === 'Tilawati/Iqro';

  const tahfidzHistory = allStudentAssessments.filter((a) => !isIqroItem(a));
  const iqroHistory = allStudentAssessments.filter((a) => isIqroItem(a));
  const activeTahfidz = tahfidzAssessment || tahfidzHistory[0];
  const activeIqro = iqroAssessment || iqroHistory[0];

  const reportDate = activeTahfidz?.date || activeIqro?.date || new Date().toISOString().split('T')[0];

  // =========================================================================
  // LEMBAR 1: LAPORAN PENILAIAN TAHFIDZ AL-QUR'AN
  // =========================================================================
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(1.8);
  doc.rect(10, 10, 190, 277);

  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.7);
  doc.rect(13, 13, 184, 271);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(5, 150, 105);
  doc.text('TK ISLAM AL MISHBAH', 105, 24, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(180, 83, 9);
  doc.text('LEMBAR 1: LAPORAN PENILAIAN TAHFIDZ AL-QUR\'AN (HAFALAN)', 105, 30, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(107, 114, 128);
  doc.text(`${SCHOOL_ASSETS.address} | Telp: ${SCHOOL_ASSETS.phone}`, 105, 35, { align: 'center' });

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.4);
  doc.line(20, 39, 190, 39);

  // Student Info Card - Page 1
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(20, 43, 170, 28, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(5, 150, 105);
  doc.text('BIODATA SANTRI & PEMBIMBING TAHFIDZ', 25, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text(`Nama Santri    : ${student.name}`, 25, 56);
  doc.text(`Kelas / Rombel : ${student.className}`, 25, 62);
  doc.text(`NIS / NISN     : ${student.id} / ${student.nisn}`, 25, 68);

  doc.text(`Tanggal Evaluasi : ${activeTahfidz?.date || reportDate}`, 112, 56);
  doc.text(`Guru Pembimbing  : ${activeTahfidz?.teacherName || '-'}`, 112, 62);
  doc.text(`Kelompok Halaqoh : ${student.halaqohGroup}`, 112, 68);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text('MATERI HAFALAN & ASPEK PENILAIAN TAHFIDZ:', 20, 80);

  const tahfidzRows = activeTahfidz
    ? [
        [
          'Surah & Ayat Disetorkan',
          activeTahfidz.surahOrJilid,
          activeTahfidz.type
        ],
        [
          '1. Kelancaran Hafalan (Tartil)',
          formatScoreText(activeTahfidz.kelancaranScore),
          'Kelancaran melafalkan ayat hafalan tanpa ragu & tidak terbata-bata'
        ],
        [
          '2. Makhorijul Huruf',
          formatScoreText(activeTahfidz.makhorijulHurufScore),
          'Ketepatan tempat keluarnya huruf hijaiyah (Halaq, Lisan, Syafatain)'
        ],
        [
          '3. Ahkam Tajwid',
          formatScoreText(activeTahfidz.ahkamTajwidScore),
          'Ketepatan hukum bacaan Mad, Ghunnah, Idgham, Ikhfa, & Qolqolah'
        ],
        [
          'Predikat Akhir Tahfidz',
          activeTahfidz.grade.toUpperCase(),
          activeTahfidz.passed ? 'TUNTAS & SIAP LANJUT SURAH BERIKUTNYA' : 'PERLU MUROJA\'AH ULANG'
        ]
      ]
    : [
        [
          'Status Penilaian Tahfidz',
          'Belum Ada Data',
          'Belum ada setoran Tahfidz yang dicatat untuk santri ini pada periode aktif'
        ]
      ];

  autoTable(doc, {
    startY: 84,
    head: [['Aspek Penilaian Tahfidz', 'Capaian Nilai', 'Standar Kompetensi & Keterangan']],
    body: tahfidzRows,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8.3,
      cellPadding: 3,
      valign: 'middle'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 52 },
      1: { cellWidth: 52, halign: 'center' },
      2: { cellWidth: 'auto' }
    }
  });

  let page1Y = (doc as any).lastAutoTable.finalY + 7;

  if (tahfidzHistory.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105);
    doc.text('RIWAYAT SETORAN TAHFIDZ TERBARU:', 20, page1Y);

    autoTable(doc, {
      startY: page1Y + 3,
      head: [['Tanggal', 'Surah / Ayat', 'Jenis Setoran', 'Predikat']],
      body: tahfidzHistory.slice(0, 4).map((h) => [
        h.date,
        h.surahOrJilid,
        h.type,
        h.grade
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 7.8
      },
      styles: {
        fontSize: 7.8,
        cellPadding: 2.2
      }
    });

    page1Y = (doc as any).lastAutoTable.finalY + 7;
  }

  // Catatan Guru Tahfidz Box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(20, page1Y, 170, 26, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text('CATATAN PEMBIMBING TAHFIDZ & SARAN MUROJA\'AH:', 25, page1Y + 6.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.3);
  doc.setTextColor(55, 65, 81);
  const tahfidzNoteText =
    activeTahfidz?.teacherNote ||
    'Ajak ananda mengulang hafalan surat pendek secara rutin sebelum tidur dan sesudah sholat subuh/maghrib.';
  doc.text(doc.splitTextToSize(tahfidzNoteText, 160), 25, page1Y + 13);

  // Tips & Signatures Page 1
  const sign1Y = Math.min(page1Y + 34, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(55, 65, 81);
  doc.text('Pembimbing Tahfidz,', 30, sign1Y);
  doc.text(activeTahfidz?.teacherName || '( Guru Halaqoh )', 30, sign1Y + 18);

  doc.text('Wali Murid / Orang Tua,', 132, sign1Y);
  doc.text(`( ${student.parentName} )`, 132, sign1Y + 18);

  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Lembar 1 dari 2 • Laporan Penilaian Tahfidz Al-Qur\'an TK Islam Al Mishbah', 105, 279, {
    align: 'center'
  });

  // =========================================================================
  // LEMBAR 2: LAPORAN PENILAIAN MEMBACA IQRO / TILAWATI
  // =========================================================================
  doc.addPage();

  doc.setDrawColor(180, 83, 9);
  doc.setLineWidth(1.8);
  doc.rect(10, 10, 190, 277);

  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.7);
  doc.rect(13, 13, 184, 271);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 118, 110);
  doc.text('TK ISLAM AL MISHBAH', 105, 24, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(180, 83, 9);
  doc.text('LEMBAR 2: LAPORAN PENILAIAN MEMBACA IQRO / TILAWATI', 105, 30, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(107, 114, 128);
  doc.text(`${SCHOOL_ASSETS.address} | Telp: ${SCHOOL_ASSETS.phone}`, 105, 35, { align: 'center' });

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.4);
  doc.line(20, 39, 190, 39);

  // Student Info Card - Page 2
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(20, 43, 170, 28, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9);
  doc.text('BIODATA SANTRI & PEMBIMBING MEMBACA IQRO', 25, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text(`Nama Santri    : ${student.name}`, 25, 56);
  doc.text(`Kelas / Rombel : ${student.className}`, 25, 62);
  doc.text(`NIS / NISN     : ${student.id} / ${student.nisn}`, 25, 68);

  doc.text(`Tanggal Simak   : ${activeIqro?.date || reportDate}`, 112, 56);
  doc.text(`Guru Pembimbing : ${activeIqro?.teacherName || '-'}`, 112, 62);
  doc.text(`Kelompok        : ${student.halaqohGroup}`, 112, 68);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text('CAPAIAN JILID & ASPEK PENILAIAN MEMBACA IQRO:', 20, 80);

  const iqroMaterialLabel = activeIqro
    ? activeIqro.iqroJilid && activeIqro.iqroPage
      ? `${activeIqro.iqroJilid} (${activeIqro.iqroPage})`
      : activeIqro.surahOrJilid
    : '-';

  const iqroRows = activeIqro
    ? [
        [
          'Jilid & Halaman Iqro',
          iqroMaterialLabel,
          'Target membaca klasikal & privat bersama pembimbing halaqoh'
        ],
        [
          '1. Pengenalan Huruf & Harakat',
          formatScoreText(activeIqro.kelancaranScore),
          'Ketepatan mengenal bentuk huruf hijaiyah serta tanda fathah, kasroh, dhommah'
        ],
        [
          '2. Kelancaran Sambung Kata',
          formatScoreText(activeIqro.makhorijulHurufScore),
          'Kemampuan membaca rangkaian huruf bersambung secara langsung tanpa mengeja'
        ],
        [
          '3. Panjang-Pendek & Makhraj Dasar',
          formatScoreText(activeIqro.ahkamTajwidScore),
          'Ketepatan membedakan bacaan pendek (1 harakat) & panjang (Mad 2 harakat)'
        ],
        [
          'Predikat Membaca Iqro',
          activeIqro.grade.toUpperCase(),
          activeIqro.passed ? 'NAIK / LANJUT KE HALAMAN BERIKUTNYA' : 'ULANGI HALAMAN UNTUK PENGUATAN'
        ]
      ]
    : [
        [
          'Status Penilaian Iqro',
          'Belum Ada Data',
          'Belum ada penilaian membaca Iqro yang dicatat untuk santri ini pada periode aktif'
        ]
      ];

  autoTable(doc, {
    startY: 84,
    head: [['Aspek Penilaian Membaca Iqro', 'Capaian Nilai', 'Standar Kompetensi & Keterangan']],
    body: iqroRows,
    theme: 'grid',
    headStyles: {
      fillColor: [180, 83, 9],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8.3,
      cellPadding: 3,
      valign: 'middle'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 52 },
      1: { cellWidth: 52, halign: 'center' },
      2: { cellWidth: 'auto' }
    }
  });

  let page2Y = (doc as any).lastAutoTable.finalY + 7;

  if (iqroHistory.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text('RIWAYAT SIMAK BACAAN IQRO TERBARU:', 20, page2Y);

    autoTable(doc, {
      startY: page2Y + 3,
      head: [['Tanggal', 'Jilid & Halaman Iqro', 'Status Halaman', 'Predikat']],
      body: iqroHistory.slice(0, 4).map((h) => [
        h.date,
        h.iqroJilid && h.iqroPage ? `${h.iqroJilid} • ${h.iqroPage}` : h.surahOrJilid,
        h.passed ? 'Lanjut Halaman' : 'Ulang Halaman',
        h.grade
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [217, 119, 6],
        textColor: [255, 255, 255],
        fontSize: 7.8
      },
      styles: {
        fontSize: 7.8,
        cellPadding: 2.2
      }
    });

    page2Y = (doc as any).lastAutoTable.finalY + 7;
  }

  // Catatan Guru Iqro Box
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(20, page2Y, 170, 26, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('CATATAN GURU IQRO & PANDUAN MENYIMAK DI RUMAH:', 25, page2Y + 6.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.3);
  doc.setTextColor(55, 65, 81);
  const iqroNoteText =
    activeIqro?.teacherNote ||
    'Latih ananda menunjuk setiap huruf pada buku Iqro selama 5-10 menit di rumah dengan suara tenang dan jelas.';
  doc.text(doc.splitTextToSize(iqroNoteText, 160), 25, page2Y + 13);

  const sign2Y = Math.min(page2Y + 34, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(55, 65, 81);
  doc.text('Pembimbing Membaca Iqro,', 30, sign2Y);
  doc.text(activeIqro?.teacherName || '( Guru Halaqoh )', 30, sign2Y + 18);

  doc.text('Wali Murid / Orang Tua,', 132, sign2Y);
  doc.text(`( ${student.parentName} )`, 132, sign2Y + 18);

  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text('Lembar 2 dari 2 • Laporan Penilaian Membaca Iqro TK Islam Al Mishbah', 105, 279, {
    align: 'center'
  });

  doc.save(`Laporan_Halaqoh_2_Lembar_${student.name.replace(/\s+/g, '_')}_${reportDate}.pdf`);
};

export const exportSppReceiptPDF = (invoice: SppInvoice, student: Student) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // compact receipt
  });

  // Border & Header
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 148, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105);
  doc.text('TK ISLAM AL MISHBAH', 74, 16, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('KUITANSI PEMBAYARAN RESMI ELEKTRONIK', 74, 21, { align: 'center' });
  doc.text('Jl. Raya Pelita No. 12 | WA Keuangan: 0812-9988-1122', 74, 25, { align: 'center' });

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.4);
  doc.line(10, 28, 138, 28);

  // Invoice Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);

  doc.text(`No. Transaksi : ${invoice.id}`, 12, 36);
  doc.text(`Tgl Bayar     : ${invoice.paidDate || new Date().toLocaleString('id-ID')}`, 12, 42);
  doc.text(`Metode        : ${invoice.paymentMethod || 'Online Transfer'}`, 12, 48);

  doc.text(`Santri  : ${student.name}`, 80, 36);
  doc.text(`Kelas   : ${student.className}`, 80, 42);
  doc.text(`Wali    : ${student.parentName}`, 80, 48);

  // Items Table
  autoTable(doc, {
    startY: 54,
    head: [['Deskripsi Pembayaran', 'Bulan/Periode', 'Jumlah']],
    body: [
      [
        invoice.category,
        invoice.monthYear,
        `Rp ${invoice.amount.toLocaleString('id-ID')}`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // LUNAS Badge
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(12, finalY, 124, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text('STATUS: LUNAS - TERVERIFIKASI SISTEM', 74, finalY + 8, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text(`Ref ID: ${invoice.transactionRef || 'AUTOPAY-' + invoice.id} | Sah tanpa tanda tangan basah`, 74, finalY + 14, { align: 'center' });

  // Footer notes
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text('Terima kasih atas partisipasi dan amanah Ayah/Bunda dalam mendukung pendidikan ananda di TK Al Mishbah.', 74, finalY + 28, { align: 'center' });

  doc.save(`Kuitansi_SPP_${student.name.replace(/\s+/g, '_')}_${invoice.monthYear.replace(/\s+/g, '_')}.pdf`);
};
