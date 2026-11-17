import React, { useState } from 'react';
import { Student } from '../../types';
import { StudentQrCard } from '../cards/StudentQrCard';
import {
  QrCode,
  Printer,
  X,
  CheckSquare,
  Square,
  Filter,
  Layers,
  Sparkles,
  Download,
  Info,
  Check
} from 'lucide-react';

interface StudentQrCardGeneratorModalProps {
  students: Student[];
  onClose: () => void;
  initialSelectedStudentId?: string;
}

export const StudentQrCardGeneratorModal: React.FC<StudentQrCardGeneratorModalProps> = ({
  students,
  onClose,
  initialSelectedStudentId
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(() => {
    if (initialSelectedStudentId) {
      return [initialSelectedStudentId];
    }
    return students.map((s) => s.id); // Default select all
  });

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [displayMode, setDisplayMode] = useState<'qr_and_barcode' | 'qr_only' | 'barcode_only'>('qr_and_barcode');
  const [viewMode, setViewMode] = useState<'sheet' | 'single'>('sheet');

  const classList = ['TK A-1', 'TK A-2', 'TK B-1', 'TK B-2', 'Playgroup'];

  const filteredStudents = students.filter(
    (s) => !selectedClass || s.className === selectedClass
  );

  const selectedStudents = students.filter((s) => selectedStudentIds.includes(s.id));

  // Toggle selection
  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const idsInCurrentView = filteredStudents.map((s) => s.id);
    const allSelected = idsInCurrentView.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !idsInCurrentView.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...idsInCurrentView])));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Container */}
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-emerald-950 rounded-2xl shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Generator & Pencetakan Kartu QR Santri Masal
                </h3>
                <span className="text-[10px] font-bold bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full">
                  Fitur Guru & TU
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Buat dan cetak kartu tanda pelajar ber-QR code unik untuk setiap santri agar mudah dipindai saat presensi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Control Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Class Filter & Selection Stats */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-none"
              >
                <option value="">Semua Rombel ({students.length} Santri)</option>
                {classList.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              {filteredStudents.every((s) => selectedStudentIds.includes(s.id))
                ? 'Batal Pilih Semua'
                : 'Pilih Semua Santri'}
            </button>

            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl">
              {selectedStudents.length} dari {students.length} Santri Terpilih
            </span>
          </div>

          {/* Layout Options */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                  orientation === 'portrait'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portrait Lanyard
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                  orientation === 'landscape'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Landscape Card
              </button>
            </div>

            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-emerald-600 shadow-2xs"
            >
              <option value="qr_and_barcode">QR Code + Barcode</option>
              <option value="qr_only">Hanya QR Code 2D</option>
              <option value="barcode_only">Hanya Barcode 1D</option>
            </select>
          </div>
        </div>

        {/* Main Body: Left Student Selector Drawer, Right Printable Sheet Grid */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Student Checkbox List */}
          <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/70 p-3 overflow-y-auto max-h-[60vh] lg:max-h-none space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
              Daftar Santri untuk Dicetak:
            </div>

            {filteredStudents.map((std) => {
              const isChecked = selectedStudentIds.includes(std.id);
              return (
                <div
                  key={std.id}
                  onClick={() => handleToggleStudent(std.id)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isChecked
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-emerald-700">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <img
                    src={std.photoUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-emerald-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="font-bold text-slate-800 truncate">{std.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {std.className} • {std.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Sheet Preview */}
          <div className="lg:col-span-8 p-6 overflow-y-auto bg-slate-200/50 flex flex-col items-center">
            {/* Sheet Instructions */}
            <div className="w-full max-w-2xl mb-4 p-3 rounded-2xl bg-white border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Pratinjau Lembar Cetak A4: Siap dipotong dan dimasukkan ke dalam plastik tali lanyard santri.
                </span>
              </div>
              <span className="font-mono font-bold text-[11px] text-emerald-700 shrink-0">
                {selectedStudents.length} Kartu
              </span>
            </div>

            {/* Printable Multi-Card Sheet */}
            {selectedStudents.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <QrCode className="w-12 h-12 mb-2 text-slate-300 stroke-1" />
                <p>Pilih setidaknya satu santri di sebelah kiri untuk menghasilkan kartu.</p>
              </div>
            ) : (
              <div className="print-sheet-area flex flex-wrap justify-center gap-4 max-w-3xl">
                {selectedStudents.map((std) => (
                  <div key={std.id} className="relative group">
                    <StudentQrCard
                      student={std}
                      orientation={orientation}
                      displayMode={displayMode}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Mencetak <strong>{selectedStudents.length}</strong> kartu santri ber-QR Code dengan resolusi tinggi.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedStudents.length === 0}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Cetak Kartu Santri Terpilih ({selectedStudents.length})
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
