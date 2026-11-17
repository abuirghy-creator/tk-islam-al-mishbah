import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentAttendanceRecord, TeacherAttendanceRecord, Student, HalaqohAssessment, SppInvoice } from '../types';
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

export const exportHalaqohReportPDF = (assessment: HalaqohAssessment, student: Student) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Green Ornamental border
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(2);
  doc.rect(10, 10, 190, 277);

  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.rect(13, 13, 184, 271);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text('TK ISLAM AL MISHBAH', 105, 26, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6);
  doc.text('LEMBAR MUTABA\'AH & PERKEMBANGAN TAHFIDZ AL-QUR\'AN', 105, 33, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  doc.text(SCHOOL_ASSETS.address + ' | Telp: ' + SCHOOL_ASSETS.phone, 105, 38, { align: 'center' });

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.4);
  doc.line(20, 42, 190, 42);

  // Student Info Card
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(20, 47, 170, 30, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105);
  doc.text('BIODATA SANTRI CILIK', 25, 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(31, 41, 55);
  doc.text(`Nama Santri    : ${student.name}`, 25, 61);
  doc.text(`Kelas / Rombel : ${student.className}`, 25, 67);
  doc.text(`NIS / NISN     : ${student.id} / ${student.nisn}`, 25, 73);

  doc.text(`Tanggal Setoran : ${assessment.date}`, 115, 61);
  doc.text(`Guru Halaqoh    : ${assessment.teacherName}`, 115, 67);
  doc.text(`Kelompok        : ${student.halaqohGroup}`, 115, 73);

  // Assessment Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('MATERI SETORAN & ASPEK PENILAIAN TAHFIDZ:', 20, 87);

  autoTable(doc, {
    startY: 92,
    head: [['Aspek Penilaian Tahfidz', 'Pencapaian Nilai', 'Standar Kompetensi & Kriteria']],
    body: [
      [
        'Surah / Ayat / Jilid Disetorkan',
        assessment.surahOrJilid,
        assessment.type
      ],
      [
        'Kelancaran (Fashahah / Tartil)',
        `${'★'.repeat(assessment.kelancaranScore)}${'☆'.repeat(5 - assessment.kelancaranScore)} (${assessment.kelancaranScore}/5)`,
        'Kelancaran melafalkan ayat tanpa terbata-bata & tidak ragu'
      ],
      [
        'Makhorijul Huruf (Ketepatan Makhraj)',
        `${'★'.repeat(assessment.makhorijulHurufScore)}${'☆'.repeat(5 - assessment.makhorijulHurufScore)} (${assessment.makhorijulHurufScore}/5)`,
        'Ketepatan bunyi huruf (Halaq, Lisan, Syafatain, Khaisyum)'
      ],
      [
        'Ahkam Tajwid (Hukum Bacaan)',
        `${'★'.repeat(assessment.ahkamTajwidScore)}${'☆'.repeat(5 - assessment.ahkamTajwidScore)} (${assessment.ahkamTajwidScore}/5)`,
        'Penerapan Mad, Ghunnah, Idgham, Ikhfa, dan Qolqolah'
      ],
      [
        'Predikat Akhir Halaqoh',
        assessment.grade.toUpperCase(),
        assessment.passed ? 'TUNTAS & SIAP LANJUT KE SURAH BERIKUTNYA' : 'PERLU MUROJA\'AH ULANG'
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      valign: 'middle'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { cellWidth: 45, halign: 'center' },
      2: { cellWidth: 'auto' }
    }
  });

  const noteY = (doc as any).lastAutoTable.finalY + 10;

  // Catatan Guru Box
  doc.setFillColor(254, 243, 199); // Amber light
  doc.roundedRect(20, noteY, 170, 32, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9);
  doc.text('CATATAN PEMBIMBING & SARAN UNTUK ORANG TUA:', 25, noteY + 7);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  const splitNote = doc.splitTextToSize(assessment.teacherNote, 160);
  doc.text(splitNote, 25, noteY + 14);

  // Murojaah at home encouragement
  const encourageY = noteY + 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text('Tips Muroja\'ah di Rumah:', 20, encourageY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('1. Dengarkan audio tartil qori cilik sebelum tidur dan saat santai pagi.', 20, encourageY + 5);
  doc.text('2. Ajak santri membaca 3-5 kali dengan nada ceria bersama Ayah / Bunda.', 20, encourageY + 10);
  doc.text('3. Berikan apresiasi dan pelukan hangat setiap kali santri menyelesaikan hafalan.', 20, encourageY + 15);

  // Signatures
  const signY = encourageY + 30;
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('Pembimbing Halaqoh,', 30, signY);
  doc.text(assessment.teacherName, 30, signY + 22);

  doc.text('Wali Murid / Orang Tua,', 135, signY);
  doc.text(`( ${student.parentName} )`, 135, signY + 22);

  doc.save(`Laporan_Tahfidz_${student.name.replace(/\s+/g, '_')}_${assessment.date}.pdf`);
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
