import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HalaqohAssessment, HalaqohCategory, GradeLevel, Student } from '../../types';
import {
  BookOpen,
  Star,
  Award,
  Sparkles,
  Download,
  Plus,
  Flame,
  Check,
  FileText,
  BookMarked,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportHalaqohReportPDF } from '../../services/pdfService';

const IQRO_JILID_OPTIONS = [
  'Pra-Tahsin (Pengenalan Huruf)',
  'Iqro Jilid 1',
  'Iqro Jilid 2',
  'Iqro Jilid 3',
  'Iqro Jilid 4',
  'Iqro Jilid 5',
  'Iqro Jilid 6',
  'Tilawati Jilid 1',
  'Tilawati Jilid 2',
  'Tilawati Jilid 3'
];

export const isIqroAssessment = (item: HalaqohAssessment): boolean =>
  item.category === 'Iqro' || item.type === 'Membaca Iqro' || item.type === 'Tilawati/Iqro';

export const HalaqohTahfidz: React.FC = () => {
  const { students, halaqohAssessments, addHalaqohAssessment, currentUser } = useApp();

  // Separated view tab: Tahfidz vs Membaca Iqro vs Ringkasan 2 Lembar Per Santri
  const [activeSectionTab, setActiveSectionTab] = useState<'tahfidz' | 'iqro' | 'summary'>('tahfidz');
  const [filterStudentId, setFilterStudentId] = useState<string>('all');

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCategory, setFormCategory] = useState<HalaqohCategory>('Tahfidz');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');

  // Tahfidz-specific fields
  const [surahOrJilid, setSurahOrJilid] = useState('Surah An-Nas (Ayat 1-6)');
  const [tahfidzType, setTahfidzType] = useState<'Tahfidz (Hafalan Baru)' | "Muroja'ah (Ulang Hafalan)">(
    'Tahfidz (Hafalan Baru)'
  );

  // Iqro-specific fields
  const [iqroJilid, setIqroJilid] = useState('Iqro Jilid 2');
  const [iqroPage, setIqroPage] = useState('Halaman 14-15');

  // Shared 3-aspect scores & result
  const [kelancaranScore, setKelancaranScore] = useState(5);
  const [makhorijulHurufScore, setMakhorijulHurufScore] = useState(5);
  const [ahkamTajwidScore, setAhkamTajwidScore] = useState(4);
  const [grade, setGrade] = useState<GradeLevel>('Mumtaz (Istimewa)');
  const [passed, setPassed] = useState<boolean>(true);
  const [teacherNote, setTeacherNote] = useState(
    'Masya Allah, hafalan sangat lancar dan tartil! Terus diulang murojaah bersama bunda ya.'
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // If user is parent, filter to their child's records
  const isParent = currentUser.role === 'ortu';
  const myStudent =
    isParent && currentUser.relatedStudentId
      ? students.find((s) => s.id === currentUser.relatedStudentId) || students[0]
      : null;

  const relevantAssessments = useMemo(() => {
    if (isParent && myStudent) {
      return halaqohAssessments.filter((h) => h.studentId === myStudent.id);
    }
    if (filterStudentId !== 'all') {
      return halaqohAssessments.filter((h) => h.studentId === filterStudentId);
    }
    return halaqohAssessments;
  }, [halaqohAssessments, isParent, myStudent, filterStudentId]);

  const tahfidzAssessments = useMemo(
    () => relevantAssessments.filter((h) => !isIqroAssessment(h)),
    [relevantAssessments]
  );

  const iqroAssessments = useMemo(
    () => relevantAssessments.filter((h) => isIqroAssessment(h)),
    [relevantAssessments]
  );

  const openAssessmentModal = (category: HalaqohCategory) => {
    setFormCategory(category);
    if (category === 'Tahfidz') {
      setSurahOrJilid('Surah An-Nas (Ayat 1-6)');
      setTahfidzType('Tahfidz (Hafalan Baru)');
      setTeacherNote(
        'Masya Allah, hafalan sangat lancar dan tartil! Terus diulang murojaah bersama bunda ya.'
      );
    } else {
      setIqroJilid('Iqro Jilid 2');
      setIqroPage('Halaman 14-15');
      setTeacherNote(
        'Alhamdulillah, ananda lancar mengenal huruf dan harakat. Latih kembali bacaan panjang-pendek di rumah ya.'
      );
    }
    setKelancaranScore(5);
    setMakhorijulHurufScore(4);
    setAhkamTajwidScore(4);
    setGrade('Mumtaz (Istimewa)');
    setPassed(true);
    setIsFormOpen(true);
  };

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const isIqro = formCategory === 'Iqro';
    const combinedMaterial = isIqro ? `${iqroJilid} • ${iqroPage}` : surahOrJilid;

    addHalaqohAssessment({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: selectedStudent.className,
      teacherName:
        currentUser.role === 'guru' ? currentUser.name : 'Ustadzah Fatimah Azzahra, S.Pd.I',
      category: formCategory,
      surahOrJilid: combinedMaterial,
      iqroJilid: isIqro ? iqroJilid : undefined,
      iqroPage: isIqro ? iqroPage : undefined,
      type: isIqro ? 'Membaca Iqro' : tahfidzType,
      kelancaranScore,
      makhorijulHurufScore,
      ahkamTajwidScore,
      grade,
      teacherNote,
      passed
    });

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    setActiveSectionTab(isIqro ? 'iqro' : 'tahfidz');
    setIsFormOpen(false);
  };

  // Export 2-page PDF combining Student's Tahfidz (Page 1) & Membaca Iqro (Page 2)
  const handleDownloadTwoPagePDF = (student: Student, focusedItem?: HalaqohAssessment) => {
    const studentHistory = halaqohAssessments.filter((h) => h.studentId === student.id);
    const studentTahfidz =
      focusedItem && !isIqroAssessment(focusedItem)
        ? focusedItem
        : studentHistory.find((h) => !isIqroAssessment(h));
    const studentIqro =
      focusedItem && isIqroAssessment(focusedItem)
        ? focusedItem
        : studentHistory.find((h) => isIqroAssessment(h));

    exportHalaqohReportPDF(student, studentTahfidz, studentIqro, studentHistory);
  };

  const renderStars = (score: number, onChange?: (val: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!onChange}
            onClick={() => onChange && onChange(star)}
            className={`transition-transform ${onChange ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`w-4 h-4 ${
                star <= score ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const summaryStudents = useMemo(() => {
    if (isParent && myStudent) return [myStudent];
    if (filterStudentId !== 'all') return students.filter((s) => s.id === filterStudentId);
    return students;
  }, [students, isParent, myStudent, filterStudentId]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-700/80 rounded-lg text-amber-300">
              <BookOpen className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-300">
              Halaqoh Al-Qur'an • Tahfidz &amp; Membaca Iqro Terpisah
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Penilaian Tahfidz &amp; Membaca Iqro (Laporan 2 Lembar PDF)
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mt-1">
            Penilaian <strong>Tahfidz (Hafalan)</strong> dan <strong>Membaca Iqro</strong> dicatat terpisah sesuai aspek masing-masing, lalu dicetak dalam 1 file PDF berisi <strong>2 lembar resmi</strong> (Lembar 1: Tahfidz, Lembar 2: Membaca Iqro).
          </p>
        </div>

        {/* Input Assessment Buttons for Teachers */}
        {!isParent && (
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => openAssessmentModal('Tahfidz')}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Input Nilai Tahfidz
            </button>
            <button
              type="button"
              onClick={() => openAssessmentModal('Iqro')}
              className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookMarked className="w-4 h-4 text-amber-600" />
              Input Nilai Iqro
            </button>
          </div>
        )}
      </div>

      {/* Halaqoh Groups Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
              Lembar 1: Penilaian Tahfidz
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-0.5">
              Hafalan Baru &amp; Muroja'ah
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Menilai Kelancaran Hafalan (Tartil), Makhorijul Huruf &amp; Ahkam Tajwid ({tahfidzAssessments.length} nilai).
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">
              Lembar 2: Penilaian Membaca Iqro
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-0.5">
              Jilid Iqro / Tilawati Harian
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Menilai Pengenalan Huruf &amp; Harakat, Sambung Kata &amp; Panjang-Pendek ({iqroAssessments.length} nilai).
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-teal-700 tracking-wider">
              Format Rapor Halaqoh PDF
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-0.5">
              1 File PDF Berisi 2 Lembar
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Otomatis menggabungkan Laporan Tahfidz (Hal. 1) &amp; Laporan Membaca Iqro (Hal. 2) per santri.
            </p>
          </div>
        </div>
      </div>

      {/* For Parents: Highlights of their Child's Quran Achievements */}
      {isParent && myStudent && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <img
                src={myStudent.photoUrl}
                alt={myStudent.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-md"
              />
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                  PORTAL WALI MURID: {myStudent.className}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Mutaba'ah Tahfidz &amp; Membaca Iqro ananda {myStudent.name}
                </h3>
                <p className="text-xs text-slate-600">
                  Pembimbing: {myStudent.halaqohGroup} • {tahfidzAssessments.length} Tahfidz &amp;{' '}
                  {iqroAssessments.length} Iqro Tercatat
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadTwoPagePDF(myStudent)}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              Unduh Rapor 2 Lembar (PDF)
            </button>
          </div>
        </div>
      )}

      {/* Main Separated Section Container */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-6">
        {/* Top Tabs & Student Filter */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSectionTab('tahfidz')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSectionTab === 'tahfidz'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>Penilaian Tahfidz ({tahfidzAssessments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSectionTab('iqro')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSectionTab === 'iqro'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>Penilaian Membaca Iqro ({iqroAssessments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSectionTab('summary')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSectionTab === 'summary'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Rekap &amp; Cetak 2 Lembar PDF</span>
            </button>
          </div>

          {!isParent && (
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <span className="text-xs font-bold text-slate-600">Filter Santri:</span>
              <select
                value={filterStudentId}
                onChange={(e) => setFilterStudentId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-emerald-600 max-w-[240px]"
              >
                <option value="all">Semua Santri ({students.length})</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.className})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* SECTION 1: PENILAIAN TAHFIDZ */}
        {activeSectionTab === 'tahfidz' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Daftar Penilaian Tahfidz Al-Qur'an (Lembar 1 Laporan PDF)
                </h3>
                <p className="text-xs text-slate-500">
                  Aspek Tahfidz meliputi Kelancaran Hafalan (Tartil), Makhorijul Huruf, dan Ahkam Tajwid.
                </p>
              </div>
              {!isParent && (
                <button
                  type="button"
                  onClick={() => openAssessmentModal('Tahfidz')}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Nilai Tahfidz
                </button>
              )}
            </div>

            {tahfidzAssessments.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-300 rounded-2xl text-xs text-slate-500">
                Belum ada penilaian Tahfidz yang dicatat untuk filter santri ini.
              </div>
            ) : (
              <div className="space-y-4">
                {tahfidzAssessments.map((item) => {
                  const student = students.find((s) => s.id === item.studentId) || students[0];
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/30 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-[270px]">
                        <img
                          src={student?.photoUrl}
                          alt={item.studentName}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shrink-0 shadow-xs"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-700 text-white">
                              TAHFIDZ
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              {item.className}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {item.date}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {item.studentName}
                          </h4>
                          <div className="text-xs font-extrabold text-emerald-800 mt-1 flex items-center gap-1 font-mono">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                            {item.surahOrJilid} ({item.type})
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-2">
                            "{item.teacherNote}"
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-slate-200 text-xs w-full lg:w-auto">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">
                            1. Kelancaran (Tartil)
                          </span>
                          {renderStars(item.kelancaranScore)}
                          <span className="text-[10px] font-semibold text-slate-600 mt-0.5 block">
                            {item.kelancaranScore}/5 Bintang
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">
                            2. Makhorijul Huruf
                          </span>
                          {renderStars(item.makhorijulHurufScore)}
                          <span className="text-[10px] font-semibold text-slate-600 mt-0.5 block">
                            {item.makhorijulHurufScore}/5 Bintang
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">
                            3. Ahkam Tajwid
                          </span>
                          {renderStars(item.ahkamTajwidScore)}
                          <span className="text-[10px] font-semibold text-slate-600 mt-0.5 block">
                            {item.ahkamTajwidScore}/5 Bintang
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2 w-full lg:w-auto">
                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {item.grade}
                          </span>
                        </div>
                        {student && (
                          <button
                            type="button"
                            onClick={() => handleDownloadTwoPagePDF(student, item)}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-300" />
                            Unduh PDF (2 Lembar)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: PENILAIAN MEMBACA IQRO */}
        {activeSectionTab === 'iqro' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-amber-600" />
                  Daftar Penilaian Membaca Iqro / Tilawati (Lembar 2 Laporan PDF)
                </h3>
                <p className="text-xs text-slate-500">
                  Aspek Membaca Iqro meliputi Pengenalan Huruf &amp; Harakat, Kelancaran Sambung Kata, serta Panjang-Pendek &amp; Makhraj Dasar.
                </p>
              </div>
              {!isParent && (
                <button
                  type="button"
                  onClick={() => openAssessmentModal('Iqro')}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Nilai Iqro
                </button>
              )}
            </div>

            {iqroAssessments.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-amber-300 rounded-2xl text-xs text-slate-500">
                Belum ada penilaian Membaca Iqro yang dicatat untuk filter santri ini.
              </div>
            ) : (
              <div className="space-y-4">
                {iqroAssessments.map((item) => {
                  const student = students.find((s) => s.id === item.studentId) || students[0];
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-white to-amber-50/40 hover:border-amber-400 hover:shadow-md transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-[270px]">
                        <img
                          src={student?.photoUrl}
                          alt={item.studentName}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500 shrink-0 shadow-xs"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950">
                              MEMBACA IQRO
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                              {item.className}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {item.date}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {item.studentName}
                          </h4>
                          <div className="text-xs font-extrabold text-amber-900 mt-1 flex items-center gap-1 font-mono">
                            <BookMarked className="w-3.5 h-3.5 text-amber-600" />
                            {item.iqroJilid && item.iqroPage
                              ? `${item.iqroJilid} • ${item.iqroPage}`
                              : item.surahOrJilid}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-2">
                            "{item.teacherNote}"
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-amber-200/70 text-xs w-full lg:w-auto">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">
                            1. Huruf &amp; Harakat
                          </span>
                          {renderStars(item.kelancaranScore)}
                          <span className="text-[10px] font-semibold text-slate-600 mt-0.5 block">
                            {item.kelancaranScore}/5 Bintang
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">
                            2. Sambung Kata
                          </span>
                          {renderStars(item.makhorijulHurufScore)}
                          <span className="text-[10px] font-semibold text-slate-600 mt-0.5 block">
                            {item.makhorijulHurufScore}/5 Bintang
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">
                            3. Panjang-Pendek
                          </span>
                          {renderStars(item.ahkamTajwidScore)}
                          <span className="text-[10px] font-semibold text-slate-600 mt-0.5 block">
                            {item.ahkamTajwidScore}/5 Bintang
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2 w-full lg:w-auto">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-950 border border-amber-300">
                            {item.grade}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              item.passed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.passed ? 'Lanjut Halaman' : 'Ulang Halaman'}
                          </span>
                        </div>
                        {student && (
                          <button
                            type="button"
                            onClick={() => handleDownloadTwoPagePDF(student, item)}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-300" />
                            Unduh PDF (2 Lembar)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: REKAP GABUNGAN PER SANTRI & CETAK 2 LEMBAR PDF */}
        {activeSectionTab === 'summary' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                Rekap Penilaian Tahfidz &amp; Membaca Iqro Per Santri (Cetak 2 Lembar PDF)
              </h3>
              <p className="text-xs text-slate-500">
                Setiap tombol Unduh akan menghasilkan 1 file PDF berisi 2 halaman resmi: <strong>Lembar 1 (Laporan Tahfidz)</strong> dan <strong>Lembar 2 (Laporan Membaca Iqro)</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summaryStudents.map((std) => {
                const stdRecords = halaqohAssessments.filter((h) => h.studentId === std.id);
                const latestTahfidz = stdRecords.find((h) => !isIqroAssessment(h));
                const latestIqro = stdRecords.find((h) => isIqroAssessment(h));

                return (
                  <div
                    key={std.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={std.photoUrl}
                          alt={std.name}
                          className="w-11 h-11 rounded-xl object-cover border border-emerald-400 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 truncate">{std.name}</h4>
                          <div className="text-[10px] text-slate-500 truncate">
                            {std.className} • {std.halaqohGroup}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadTwoPagePDF(std)}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-300" />
                        Unduh 2 Lembar PDF
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-emerald-200">
                        <div className="text-[10px] font-black text-emerald-700 uppercase">
                          Lembar 1 • Tahfidz
                        </div>
                        {latestTahfidz ? (
                          <>
                            <div className="font-bold text-slate-900 mt-1 truncate">
                              {latestTahfidz.surahOrJilid}
                            </div>
                            <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                              {latestTahfidz.grade} ({latestTahfidz.date})
                            </div>
                          </>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-1">Belum ada nilai Tahfidz</div>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-amber-200">
                        <div className="text-[10px] font-black text-amber-700 uppercase">
                          Lembar 2 • Membaca Iqro
                        </div>
                        {latestIqro ? (
                          <>
                            <div className="font-bold text-slate-900 mt-1 truncate">
                              {latestIqro.iqroJilid && latestIqro.iqroPage
                                ? `${latestIqro.iqroJilid} • ${latestIqro.iqroPage}`
                                : latestIqro.surahOrJilid}
                            </div>
                            <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                              {latestIqro.grade} ({latestIqro.date})
                            </div>
                          </>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-1">Belum ada nilai Iqro</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* INPUT ASSESSMENT MODAL (SEPARATED TAHFIDZ & MEMBACA IQRO) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  {formCategory === 'Tahfidz' ? (
                    <BookOpen className="w-5 h-5 text-amber-300" />
                  ) : (
                    <BookMarked className="w-5 h-5 text-amber-300" />
                  )}
                  {formCategory === 'Tahfidz'
                    ? 'Form Penilaian Tahfidz (Hafalan Al-Qur\'an)'
                    : 'Form Penilaian Membaca Iqro / Tilawati'}
                </h3>
                <p className="text-xs text-emerald-100">
                  {formCategory === 'Tahfidz'
                    ? 'Tercatat sebagai Lembar 1 pada Laporan PDF Halaqoh.'
                    : 'Tercatat sebagai Lembar 2 pada Laporan PDF Halaqoh.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="p-6 space-y-4 text-xs">
              {/* Separated Category Switcher */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl font-bold">
                <button
                  type="button"
                  onClick={() => setFormCategory('Tahfidz')}
                  className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    formCategory === 'Tahfidz'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Penilaian Tahfidz
                </button>
                <button
                  type="button"
                  onClick={() => setFormCategory('Iqro')}
                  className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    formCategory === 'Iqro'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookMarked className="w-3.5 h-3.5" /> Membaca Iqro
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Santri Cilik</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              {formCategory === 'Tahfidz' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Surah &amp; Ayat Disetorkan
                    </label>
                    <input
                      type="text"
                      required
                      value={surahOrJilid}
                      onChange={(e) => setSurahOrJilid(e.target.value)}
                      placeholder="Contoh: Surah Al-Ikhlas ayat 1-4"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Setoran Tahfidz</label>
                    <select
                      value={tahfidzType}
                      onChange={(e) =>
                        setTahfidzType(
                          e.target.value as 'Tahfidz (Hafalan Baru)' | "Muroja'ah (Ulang Hafalan)"
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                    >
                      <option value="Tahfidz (Hafalan Baru)">Tahfidz (Hafalan Baru)</option>
                      <option value="Muroja'ah (Ulang Hafalan)">Muroja'ah (Ulang Hafalan)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jilid Buku Iqro / Tilawati</label>
                    <select
                      value={iqroJilid}
                      onChange={(e) => setIqroJilid(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold"
                    >
                      {IQRO_JILID_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Halaman &amp; Baris</label>
                    <input
                      type="text"
                      required
                      value={iqroPage}
                      onChange={(e) => setIqroPage(e.target.value)}
                      placeholder="Contoh: Halaman 14-15"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                    />
                  </div>
                </div>
              )}

              {/* 3 Pillars Star Ratings (tailored labels per category) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">
                      {formCategory === 'Tahfidz'
                        ? '1. Kelancaran Hafalan (Tartil / Fashahah)'
                        : '1. Pengenalan Huruf Hijaiyah & Harakat'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formCategory === 'Tahfidz'
                        ? 'Kelancaran melafalkan ayat tanpa ragu'
                        : 'Ketepatan mengenal huruf & tanda fathah, kasroh, dhommah'}
                    </div>
                  </div>
                  {renderStars(kelancaranScore, setKelancaranScore)}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">
                      {formCategory === 'Tahfidz'
                        ? '2. Makhorijul Huruf'
                        : '2. Kelancaran Sambung Kata'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formCategory === 'Tahfidz'
                        ? 'Ketepatan makhraj bunyi huruf hijaiyah'
                        : 'Membaca rangkaian huruf bersambung tanpa mengeja'}
                    </div>
                  </div>
                  {renderStars(makhorijulHurufScore, setMakhorijulHurufScore)}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">
                      {formCategory === 'Tahfidz'
                        ? '3. Ahkam Tajwid'
                        : '3. Panjang-Pendek & Makhraj Dasar'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formCategory === 'Tahfidz'
                        ? 'Penerapan mad, ghunnah, qolqolah'
                        : 'Membedakan bacaan pendek (1 harakat) & panjang (Mad)'}
                    </div>
                  </div>
                  {renderStars(ahkamTajwidScore, setAhkamTajwidScore)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Predikat Nilai</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as GradeLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold"
                  >
                    <option value="Mumtaz (Istimewa)">Mumtaz (Istimewa)</option>
                    <option value="Jayyid Jiddan (Sangat Baik)">Jayyid Jiddan (Sangat Baik)</option>
                    <option value="Jayyid (Baik)">Jayyid (Baik)</option>
                    <option value="Maqbul (Cukup)">Maqbul (Cukup)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keputusan Lanjut</label>
                  <select
                    value={passed ? 'lanjut' : 'ulang'}
                    onChange={(e) => setPassed(e.target.value === 'lanjut')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold"
                  >
                    <option value="lanjut">
                      {formCategory === 'Tahfidz'
                        ? 'Tuntas & Lanjut Surah Berikutnya'
                        : 'Lulus & Naik / Lanjut Halaman'}
                    </option>
                    <option value="ulang">
                      {formCategory === 'Tahfidz'
                        ? 'Perlu Muroja\'ah Ulang'
                        : 'Ulangi Halaman untuk Penguatan'}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {formCategory === 'Tahfidz'
                    ? 'Catatan Pembimbing Tahfidz & Saran Muroja\'ah'
                    : 'Catatan Pembimbing Iqro & Panduan Orang Tua'}
                </label>
                <textarea
                  rows={3}
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  placeholder="Beri motivasi dan saran latihan di rumah untuk Ayah/Bunda..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Simpan Penilaian {formCategory}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
