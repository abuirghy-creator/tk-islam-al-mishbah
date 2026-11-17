import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HalaqohAssessment, GradeLevel, Student } from '../../types';
import {
  BookOpen,
  Star,
  Award,
  Sparkles,
  Download,
  CheckCircle,
  Plus,
  Calendar,
  MessageSquare,
  Flame,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportHalaqohReportPDF } from '../../services/pdfService';

export const HalaqohTahfidz: React.FC = () => {
  const { students, halaqohAssessments, addHalaqohAssessment, currentUser } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [surahOrJilid, setSurahOrJilid] = useState('Surah An-Nas (Ayat 1-6)');
  const [assessmentType, setAssessmentType] = useState<HalaqohAssessment['type']>('Tahfidz (Hafalan Baru)');
  const [kelancaranScore, setKelancaranScore] = useState(5);
  const [makhorijulHurufScore, setMakhorijulHurufScore] = useState(5);
  const [ahkamTajwidScore, setAhkamTajwidScore] = useState(4);
  const [grade, setGrade] = useState<GradeLevel>('Mumtaz (Istimewa)');
  const [teacherNote, setTeacherNote] = useState(
    'Masya Allah, hafalan sangat lancar dan tartil! Terus diulang murojaah bersama bunda ya.'
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // If user is parent, filter to their child's records
  const isParent = currentUser.role === 'ortu';
  const myStudent = isParent && currentUser.relatedStudentId
    ? students.find((s) => s.id === currentUser.relatedStudentId) || students[0]
    : null;

  const relevantAssessments = isParent && myStudent
    ? halaqohAssessments.filter((h) => h.studentId === myStudent.id)
    : halaqohAssessments;

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    addHalaqohAssessment({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: selectedStudent.className,
      teacherName: currentUser.role === 'guru' ? currentUser.name : 'Ustadzah Fatimah Azzahra, S.Pd.I',
      surahOrJilid,
      type: assessmentType,
      kelancaranScore,
      makhorijulHurufScore,
      ahkamTajwidScore,
      grade,
      teacherNote,
      passed: true
    });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    setIsFormOpen(false);
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
                star <= score
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-700/80 rounded-lg text-amber-300">
              <BookOpen className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-300">
              Halaqoh Al-Qur'an & Tahfidz Cilik
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Pembagian Halaqoh Harian & Penilaian Tajwid
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Penilaian komprehensif harian: Kelancaran (Fashahah), Makhorijul Huruf, Ahkam Tajwid, serta pelaporan perkembangan hafalan secara real-time kepada orang tua.
          </p>
        </div>

        {/* Input Assessment Button for Teachers */}
        {!isParent && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Input Penilaian Halaqoh Hari Ini
          </button>
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
              Halaqoh 1 (Juz Amma Awal)
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-0.5">
              Ustadzah Fatimah Azzahra
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Surah An-Nas s/d Al-Fil & Karakter Islami (16 Santri)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">
              Halaqoh 2 (Tahsin & Makhraj)
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-0.5">
              Ustadz Ahmad Fauzi, S.Q
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Tilawati Jilid & Penguatan Makhorijul Huruf (18 Santri)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-teal-700 tracking-wider">
              Halaqoh 3 (Doa & Hadits)
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-0.5">
              Ustadzah Nurul Hidayah
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Doa Harian, Kalimat Thayyibah & Muroja'ah (14 Santri)
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
                  Mutaba'ah & Perkembangan Hafalan ananda {myStudent.name}
                </h3>
                <p className="text-xs text-slate-600">
                  Pembimbing: {myStudent.halaqohGroup} • Update Real-Time Terhubung ke Sekolah
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Setoran Tercatat</span>
              <span className="text-2xl font-black text-emerald-800">
                {relevantAssessments.length} Surah / Ayat
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Halaqoh Assessments List */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Laporan Penilaian Hafalan & Mutaba'ah Real-Time
            </h3>
            <p className="text-xs text-slate-500">
              Evaluasi mendalam mencakup 3 pilar: Kelancaran, Makhorijul Huruf, dan Ahkam Tajwid.
            </p>
          </div>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {relevantAssessments.length} Penilaian Tersimpan
          </span>
        </div>

        <div className="space-y-4">
          {relevantAssessments.map((item) => {
            const student = students.find((s) => s.id === item.studentId) || students[0];
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
              >
                {/* Left: Student info & Surah */}
                <div className="flex items-start gap-4 min-w-[280px]">
                  <img
                    src={student?.photoUrl}
                    alt={item.studentName}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shrink-0 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {item.className}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {item.date}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      {item.studentName}
                    </h4>
                    <div className="text-xs font-extrabold text-emerald-800 mt-1 flex items-center gap-1 font-mono">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      {item.surahOrJilid} ({item.type})
                    </div>
                  </div>
                </div>

                {/* Middle: 3-Pillar Scores */}
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

                {/* Right: Grade & Download PDF button */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2 w-full lg:w-auto">
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                    {item.grade}
                  </span>

                  <button
                    onClick={() => exportHalaqohReportPDF(item, student)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Lembar PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INPUT ASSESSMENT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-300" />
                  Form Penilaian Halaqoh Santri
                </h3>
                <p className="text-xs text-emerald-100">
                  Laporan akan terkirim secara real-time ke akun orang tua santri
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="p-6 space-y-4 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Surah / Ayat / Halaman
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
                  <label className="block font-bold text-slate-700 mb-1">Jenis Setoran</label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  >
                    <option value="Tahfidz (Hafalan Baru)">Tahfidz (Hafalan Baru)</option>
                    <option value="Muroja'ah (Ulang Hafalan)">Muroja'ah (Ulang Hafalan)</option>
                    <option value="Tilawati/Iqro">Tilawati / Jilid Iqro</option>
                  </select>
                </div>
              </div>

              {/* 3 Pillars Star Ratings */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">1. Kelancaran (Tartil / Fashahah)</div>
                    <div className="text-[10px] text-slate-500">Kelancaran lafadz tanpa ragu</div>
                  </div>
                  {renderStars(kelancaranScore, setKelancaranScore)}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">2. Makhorijul Huruf</div>
                    <div className="text-[10px] text-slate-500">Ketepatan makhraj bunyi huruf hijaiyah</div>
                  </div>
                  {renderStars(makhorijulHurufScore, setMakhorijulHurufScore)}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">3. Ahkam Tajwid</div>
                    <div className="text-[10px] text-slate-500">Penerapan mad, ghunnah, qolqolah</div>
                  </div>
                  {renderStars(ahkamTajwidScore, setAhkamTajwidScore)}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Predikat Hasil Setoran</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as GradeLevel)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold"
                >
                  <option value="Mumtaz (Istimewa)">Mumtaz (Istimewa - ⭐⭐⭐⭐⭐)</option>
                  <option value="Jayyid Jiddan (Sangat Baik)">Jayyid Jiddan (Sangat Baik - ⭐⭐⭐⭐)</option>
                  <option value="Jayyid (Baik)">Jayyid (Baik - ⭐⭐⭐)</option>
                  <option value="Maqbul (Cukup)">Maqbul (Cukup - ⭐⭐)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Guru & Nasehat Muroja'ah di Rumah
                </label>
                <textarea
                  rows={3}
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  placeholder="Beri motivasi dan saran perbaikan lafadz untuk Ayah/Bunda di rumah..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Simpan & Kirim Laporan ke Ortu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
