import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  RefreshCw,
  Users,
  GraduationCap,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  parseStudentExcelFile,
  parseTeacherExcelFile,
  downloadStudentExcelTemplate,
  downloadTeacherExcelTemplate,
  ParsedStudentRow,
  ParsedTeacherRow
} from '../../utils/excelHelper';
import { useApp } from '../../context/AppContext';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'student' | 'teacher';
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  targetType
}) => {
  const { importStudentsBatch, importTeachersBatch, halaqohGroups } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'upsert' | 'replace'>('append');
  const [selectedDefaultHalaqoh, setSelectedDefaultHalaqoh] = useState<string>('auto');

  // Parsed preview states
  const [studentRows, setStudentRows] = useState<ParsedStudentRow[]>([]);
  const [teacherRows, setTeacherRows] = useState<ParsedTeacherRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isStudent = targetType === 'student';

  // Trigger file processing
  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setImportSuccessMessage(null);

    try {
      if (isStudent) {
        const rows = await parseStudentExcelFile(file);
        if (rows.length === 0) {
          throw new Error('Tidak ada baris data yang ditemukan dalam sheet Excel tersebut.');
        }
        setStudentRows(rows);
        // Select all valid rows by default
        const validIndices = rows
          .map((r, i) => (r.isValid ? i : -1))
          .filter((i) => i !== -1);
        setSelectedIndices(validIndices);
      } else {
        const rows = await parseTeacherExcelFile(file);
        if (rows.length === 0) {
          throw new Error('Tidak ada baris data yang ditemukan dalam sheet Excel tersebut.');
        }
        setTeacherRows(rows);
        const validIndices = rows
          .map((r, i) => (r.isValid ? i : -1))
          .filter((i) => i !== -1);
        setSelectedIndices(validIndices);
      }
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      setParseError(err.message || 'Gagal membaca format file Excel. Pastikan format tabel sesuai.');
      setStudentRows([]);
      setTeacherRows([]);
      setSelectedIndices([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const toggleSelectAll = () => {
    const totalCount = isStudent ? studentRows.length : teacherRows.length;
    if (selectedIndices.length === totalCount) {
      setSelectedIndices([]);
    } else {
      const all = Array.from({ length: totalCount }, (_, i) => i);
      setSelectedIndices(all);
    }
  };

  const toggleSelectRow = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleExecuteImport = () => {
    if (selectedIndices.length === 0) return;

    if (isStudent) {
      const toImport = selectedIndices.map((i) => {
        const row = studentRows[i];
        const assignedHalaqoh =
          selectedDefaultHalaqoh !== 'auto'
            ? selectedDefaultHalaqoh
            : row.halaqohGroup || 'Halaqoh 1 - Bintang (Juz Amma Awal)';

        return {
          name: row.name,
          nickName: row.nickName,
          nisn: row.nisn,
          gender: row.gender,
          className: row.className,
          parentName: row.parentName,
          parentPhone: row.parentPhone,
          parentEmail: row.parentEmail,
          address: row.address,
          photoUrl: row.photoUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80',
          birthDate: row.birthDate,
          halaqohGroup: assignedHalaqoh
        };
      });

      const count = importStudentsBatch(toImport, importMode);

      // Celebrate
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      setImportSuccessMessage(
        `Alhamdulillah! ${count} data santri berhasil diimpor otomatis, langsung terhubung ke presensi hari ini, kartu barcode aktif, dan dikelompokkan ke Halaqoh!`
      );
    } else {
      const toImport = selectedIndices.map((i) => {
        const row = teacherRows[i];
        return {
          nuptk: row.nuptk,
          name: row.name,
          gender: row.gender,
          position: row.position,
          phone: row.phone,
          email: row.email,
          teachingSubjects: row.teachingSubjects,
          status: row.status,
          photoUrl: row.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
        };
      });

      const count = importTeachersBatch(toImport, importMode);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      setImportSuccessMessage(
        `Alhamdulillah! Berhasil mengimpor dan mengisi ${count} data guru ke database sekolah secara otomatis!`
      );
    }

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const currentRowsCount = isStudent ? studentRows.length : teacherRows.length;
  const validRowsCount = isStudent
    ? studentRows.filter((r) => r.isValid).length
    : teacherRows.filter((r) => r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200">
                  Import Otomatis Excel
                </span>
                <span className="text-xs text-emerald-200 font-medium">.xlsx / .xls / .csv</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {isStudent ? 'Upload & Isi Data Santri via Excel' : 'Upload & Isi Data Guru via Excel'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Download Template Banner */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-950">
                  Belum punya format Excel yang pas?
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Unduh template Excel resmi TK Islam Al Mishbah yang sudah terstruktur dengan kolom lengkap dan contoh isian.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (isStudent) downloadStudentExcelTemplate();
                else downloadTeacherExcelTemplate();
              }}
              className="px-3.5 py-2 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>Unduh Template {isStudent ? 'Siswa' : 'Guru'} (.xlsx)</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50 scale-[1.005]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/40'
                : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  selectedFile
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {selectedFile ? (
                  <FileCheck className="w-7 h-7" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Tarik & Letakkan file Excel di sini'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk memilih file lain`
                    : 'atau klik untuk memilih file dari komputer / HP (.xlsx, .xls, .csv)'}
                </p>
              </div>

              {isParsing && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-full animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Membaca dan memetakan kolom otomatis...</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">Gagal Memproses File</p>
                <p className="mt-0.5 text-rose-700">{parseError}</p>
              </div>
            </div>
          )}

          {/* Success Notification Banner */}
          {importSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

          {/* Preview Table & Mode Selection */}
          {currentRowsCount > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Pratinjau Data Terdeteksi ({currentRowsCount} baris)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {validRowsCount} Valid
                  </span>
                  {currentRowsCount - validRowsCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {currentRowsCount - validRowsCount} Perlu dicek
                    </span>
                  )}
                </div>

                {/* Import Mode Radio */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-[11px] font-medium text-slate-700">
                  <span className="px-2 text-slate-500 font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Mode:
                  </span>
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                      importMode === 'append'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                    title="Data baru akan ditambahkan tanpa menghapus data lama"
                  >
                    Tambah (Append)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('upsert')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                      importMode === 'upsert'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                    title="Perbarui jika NISN/NUPTK atau nama sudah ada, tambah jika belum"
                  >
                    Sinkronkan (Upsert)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                      importMode === 'replace'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-600 hover:text-rose-700'
                    }`}
                    title="Hati-hati: Ganti seluruh database murid/guru yang ada dengan file ini"
                  >
                    Timpa Semua
                  </button>
                </div>
              </div>

              {/* Automatic connection notice & Halaqoh batch assign */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center gap-2.5 text-emerald-950">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5 sm:mt-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold">Otomatis Terhubung ke Presensi & Barcode Scan:</span>
                    <p className="text-[11px] text-emerald-800">
                      Santri otomatis tercatat di presensi hari ini, kartu tanda pengenal ber-barcode langsung aktif, dan terbagi ke kelompok halaqoh.
                    </p>
                  </div>
                </div>

                {isStudent && (
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Halaqoh:</span>
                    <select
                      value={selectedDefaultHalaqoh}
                      onChange={(e) => setSelectedDefaultHalaqoh(e.target.value)}
                      className="text-xs font-semibold text-emerald-900 bg-transparent focus:outline-hidden cursor-pointer max-w-[210px] truncate"
                    >
                      <option value="auto">Sesuai Kolom Excel (Otomatis)</option>
                      {halaqohGroups.map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.shortName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 text-[11px]">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              selectedIndices.length === currentRowsCount && currentRowsCount > 0
                            }
                            onChange={toggleSelectAll}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Nama Lengkap</th>
                        <th className="p-3">{isStudent ? 'NISN' : 'NUPTK / NIP'}</th>
                        <th className="p-3">{isStudent ? 'Kelas' : 'Jabatan'}</th>
                        <th className="p-3">{isStudent ? 'Orang Tua / Wali' : 'No. HP'}</th>
                        <th className="p-3">{isStudent ? 'No HP Ortu' : 'Mata Pelajaran'}</th>
                        <th className="p-3">{isStudent ? 'Halaqoh' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isStudent
                        ? studentRows.map((row, idx) => {
                            const isSelected = selectedIndices.includes(idx);
                            return (
                              <tr
                                key={idx}
                                className={`transition-colors cursor-pointer ${
                                  !row.isValid
                                    ? 'bg-rose-50/50 hover:bg-rose-50'
                                    : isSelected
                                    ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
                                    : 'hover:bg-slate-50'
                                }`}
                                onClick={() => toggleSelectRow(idx)}
                              >
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectRow(idx)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 font-semibold text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                        row.gender === 'P' ? 'bg-pink-500' : 'bg-blue-600'
                                      }`}
                                    >
                                      {row.gender}
                                    </span>
                                    <span>{row.name}</span>
                                    {row.nickName && (
                                      <span className="text-[10px] text-slate-400">
                                        ({row.nickName})
                                      </span>
                                    )}
                                  </div>
                                  {!row.isValid && (
                                    <p className="text-[10px] text-rose-600 mt-0.5">
                                      {row.validationError}
                                    </p>
                                  )}
                                </td>
                                <td className="p-3 font-mono text-[11px] text-slate-600">{row.nisn}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    {row.className}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-700">{row.parentName}</td>
                                <td className="p-3 font-mono text-[11px] text-slate-600">
                                  {row.parentPhone}
                                </td>
                                <td className="p-3 text-slate-600 text-[11px] truncate max-w-[140px]">
                                  {row.halaqohGroup}
                                </td>
                              </tr>
                            );
                          })
                        : teacherRows.map((row, idx) => {
                            const isSelected = selectedIndices.includes(idx);
                            return (
                              <tr
                                key={idx}
                                className={`transition-colors cursor-pointer ${
                                  !row.isValid
                                    ? 'bg-rose-50/50 hover:bg-rose-50'
                                    : isSelected
                                    ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
                                    : 'hover:bg-slate-50'
                                }`}
                                onClick={() => toggleSelectRow(idx)}
                              >
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectRow(idx)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 font-semibold text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                        row.gender === 'P' ? 'bg-emerald-600' : 'bg-teal-700'
                                      }`}
                                    >
                                      {row.gender}
                                    </span>
                                    <span>{row.name}</span>
                                  </div>
                                  {!row.isValid && (
                                    <p className="text-[10px] text-rose-600 mt-0.5">
                                      {row.validationError}
                                    </p>
                                  )}
                                </td>
                                <td className="p-3 font-mono text-[11px] text-slate-600">{row.nuptk}</td>
                                <td className="p-3 text-slate-700 font-medium">{row.position}</td>
                                <td className="p-3 font-mono text-[11px] text-slate-600">{row.phone}</td>
                                <td className="p-3 text-slate-600 text-[11px] truncate max-w-[140px]">
                                  {row.teachingSubjects.join(', ')}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-bold text-slate-800">
              {selectedIndices.length} dari {currentRowsCount} data
            </span>
            <span>siap diimpor otomatis</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={selectedIndices.length === 0}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                selectedIndices.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Simpan & Masukkan ke Database Otomatis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
