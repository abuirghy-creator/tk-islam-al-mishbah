import React, { useRef, useState } from 'react';
import { Student } from '../../types';
import { StudentQrCard } from './StudentQrCard';
import { X, Printer, ShieldCheck, QrCode, Smartphone, Sparkles, Layers } from 'lucide-react';

interface StudentCardModalProps {
  student: Student;
  onClose: () => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({ student, onClose }) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [displayMode, setDisplayMode] = useState<'qr_and_barcode' | 'qr_only' | 'barcode_only'>('qr_and_barcode');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-700 text-white rounded-xl">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Generator Kartu QR Santri TK Al Mishbah
              </h3>
              <p className="text-[11px] text-slate-500">
                Kartu tanda pelajar digital dengan kode QR unik untuk scan presensi cepat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Customization Options */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Orientation switch */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600 text-[11px]">Format:</span>
            <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                  orientation === 'portrait'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portrait (Lanyard)
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
                Landscape
              </button>
            </div>
          </div>

          {/* Display Mode switch */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600 text-[11px]">Kode:</span>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-slate-700 focus:outline-emerald-600"
            >
              <option value="qr_and_barcode">QR Code + Barcode</option>
              <option value="qr_only">Hanya QR Code 2D</option>
              <option value="barcode_only">Hanya Barcode 1D</option>
            </select>
          </div>
        </div>

        {/* Card Viewport Area (Printable) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-100/60">
          <div className="print-card-wrapper">
            <StudentQrCard
              student={student}
              orientation={orientation}
              displayMode={displayMode}
            />
          </div>

          <div className="mt-4 p-3 bg-white rounded-2xl border border-emerald-200 shadow-2xs text-center max-w-sm">
            <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Kode QR Unik Siap Pindai
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Kode QR ini terenkripsi unik dengan ID santri <strong className="font-mono text-slate-700">{student.id}</strong>. Saat diarahkan ke kamera atau scanner gerbang, presensi siswa langsung tercatat secara otomatis.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            Standar Cetak: Kertas Kartu PVC / Brief Card A4
          </span>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Cetak Kartu QR Ini
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
