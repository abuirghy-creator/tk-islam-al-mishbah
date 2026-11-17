import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Student } from '../../types';
import { useApp } from '../../context/AppContext';
import { SCHOOL_ASSETS } from '../../assets/images';
import { Sparkles, Phone, MapPin, QrCode } from 'lucide-react';

interface StudentQrCardProps {
  student: Student;
  orientation?: 'portrait' | 'landscape';
  displayMode?: 'qr_and_barcode' | 'qr_only' | 'barcode_only';
  showEmergencyContact?: boolean;
}

export const StudentQrCard: React.FC<StudentQrCardProps> = ({
  student,
  orientation = 'portrait',
  displayMode = 'qr_and_barcode',
  showEmergencyContact = true
}) => {
  const { schoolProfile } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR code for the student's unique ID & details
    // We encode the clean student ID which our scanner understands directly
    const qrPayload = student.barcode || student.id;

    QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#064e3b', // Deep emerald
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR Code', err));
  }, [student]);

  if (orientation === 'landscape') {
    return (
      <div className="w-[340px] h-[215px] rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-700 bg-white relative flex flex-col justify-between print:shadow-none print:border-emerald-800 print:break-inside-avoid">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-2 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={schoolProfile.logoUrl || SCHOOL_ASSETS.logo}
              alt=""
              className="w-8 h-8 rounded-full border border-amber-300 object-cover bg-white shrink-0"
            />
            <div>
              <div className="text-[10px] font-black tracking-wide text-amber-300 leading-tight">
                {schoolProfile.name}
              </div>
              <div className="text-[7.5px] text-emerald-100 leading-tight">
                KARTU IDENTITAS SANTRI (QR ID)
              </div>
            </div>
          </div>
          <span className="text-[7.5px] font-mono text-emerald-200 bg-white/10 px-1.5 py-0.5 rounded">
            {student.className}
          </span>
        </div>

        {/* Body */}
        <div className="p-2.5 flex-1 flex items-center gap-2.5">
          <img
            src={student.photoUrl}
            alt={student.name}
            className="w-16 h-20 rounded-xl object-cover border-2 border-emerald-600 shrink-0 shadow-xs"
          />

          <div className="flex-1 min-w-0 space-y-0.5 text-left">
            <span className="text-[8px] uppercase font-bold text-slate-400 block">
              Nama Lengkap
            </span>
            <h4 className="text-[11px] font-black text-slate-800 truncate leading-tight">
              {student.name}
            </h4>

            <div className="grid grid-cols-2 gap-1 text-[8px] pt-1">
              <div>
                <span className="text-slate-400 block font-bold">NIS / ID:</span>
                <span className="font-mono font-bold text-emerald-800">{student.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">NISN:</span>
                <span className="font-mono text-slate-700">{student.nisn}</span>
              </div>
            </div>

            {showEmergencyContact && (
              <div className="text-[7.5px] text-slate-500 pt-0.5">
                <span>Wali: <strong>{student.parentName}</strong> ({student.parentPhone})</span>
              </div>
            )}
          </div>

          {/* QR Code Container */}
          <div className="shrink-0 flex flex-col items-center justify-center p-1 bg-emerald-50/50 rounded-xl border border-emerald-200">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center text-emerald-700">
                <QrCode className="w-8 h-8 animate-pulse" />
              </div>
            )}
            <span className="text-[6.5px] font-bold text-emerald-800 font-mono tracking-wider">
              SCAN PRESENSI
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-emerald-950 text-[7px] text-emerald-200 py-1 px-3 flex justify-between items-center">
          <span>{SCHOOL_ASSETS.address}</span>
          <span className="font-bold text-amber-300">VALIDASI RESMI SEKOLAH</span>
        </div>
      </div>
    );
  }

  // Portrait Layout (Standard Lanyard / Badge format)
  return (
    <div className="w-[240px] rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-700 bg-white relative flex flex-col justify-between print:shadow-none print:border-emerald-800 print:break-inside-avoid">
      {/* Lanyard Hole Punch Slot Indicator (optional for printing) */}
      <div className="h-2.5 bg-emerald-950/90 flex justify-center items-center">
        <div className="w-8 h-1 rounded-full bg-slate-300/60" />
      </div>

      {/* Card Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-2.5 text-white text-center relative flex items-center gap-2">
        <img
          src={schoolProfile.logoUrl || SCHOOL_ASSETS.logo}
          alt=""
          className="w-9 h-9 rounded-full border-2 border-amber-300 object-cover bg-white shrink-0 shadow-xs"
        />
        <div className="text-left flex-1 min-w-0">
          <div className="text-[10px] font-black tracking-wide leading-tight text-amber-300">
            {schoolProfile.name}
          </div>
          <div className="text-[7.5px] text-emerald-100 leading-tight">
            KARTU TANDA PELAJAR & QR PRESENSI
          </div>
          <div className="text-[7px] text-emerald-200/80 truncate">
            {schoolProfile.npsn}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 bg-gradient-to-b from-emerald-50/40 via-white to-amber-50/20 text-center flex flex-col items-center space-y-2">
        {/* Photo with Badge */}
        <div className="relative">
          <img
            src={student.photoUrl}
            alt={student.name}
            className="w-20 h-24 rounded-xl object-cover border-2 border-emerald-600 shadow-sm"
          />
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Name and class */}
        <div className="w-full">
          <h4 className="text-xs font-black text-slate-800 leading-tight line-clamp-2">
            {student.name}
          </h4>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
              {student.className}
            </span>
            <span className="text-[8px] font-mono font-bold text-slate-600">
              {student.id}
            </span>
          </div>
        </div>

        {/* QR Code Section */}
        {(displayMode === 'qr_and_barcode' || displayMode === 'qr_only') && (
          <div className="p-1.5 bg-white rounded-xl border border-emerald-200 shadow-2xs flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code ${student.name}`}
                className="w-24 h-24 object-contain"
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center text-emerald-700">
                <QrCode className="w-10 h-10 animate-pulse" />
              </div>
            )}
            <span className="text-[7px] font-bold text-emerald-800 font-mono tracking-wider mt-0.5">
              SCAN PRESENSI CEPAT
            </span>
          </div>
        )}

        {/* 1D Barcode Graphic (if mode allows) */}
        {(displayMode === 'qr_and_barcode' || displayMode === 'barcode_only') && (
          <div className="w-full pt-1 border-t border-dashed border-emerald-200">
            <div className="flex justify-center items-center gap-[1.5px] h-6 px-2 bg-white py-0.5 rounded border border-slate-200">
              {[...Array(32)].map((_, i) => (
                <div
                  key={i}
                  className={`h-full bg-slate-900 ${
                    i % 6 === 0 ? 'w-[2.5px]' : i % 3 === 0 ? 'w-[1.5px]' : 'w-[1px]'
                  }`}
                />
              ))}
            </div>
            <div className="font-mono text-[8px] font-bold tracking-widest text-slate-800 mt-0.5">
              * {student.barcode} *
            </div>
          </div>
        )}

        {/* Details / Emergency info */}
        {showEmergencyContact && (
          <div className="w-full text-left bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-[7.5px] text-slate-600 space-y-0.5">
            <div className="truncate">Wali: <strong>{student.parentName}</strong></div>
            <div className="truncate flex items-center gap-1">
              <Phone className="w-2 h-2 text-emerald-600" />
              <span>{student.parentPhone}</span>
            </div>
            <div className="truncate text-emerald-800 font-semibold">
              {student.halaqohGroup}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="bg-emerald-900 text-[7px] text-emerald-100 py-1 px-2.5 flex justify-between items-center">
        <span>Telp: {SCHOOL_ASSETS.phone.split('/')[0]}</span>
        <span className="font-bold text-amber-300">GENERASI QUR'ANI</span>
      </div>
    </div>
  );
};
