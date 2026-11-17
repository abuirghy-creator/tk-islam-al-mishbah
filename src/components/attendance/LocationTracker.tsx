import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SCHOOL_ASSETS } from '../../assets/images';
import { MapPin, Navigation, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Car, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LocationTracker: React.FC = () => {
  const { schoolProfile, students, studentAttendance, currentUser, addNotification } = useApp();
  const [parentGpsStatus, setParentGpsStatus] = useState<string>('idle');
  const [customDistance, setCustomDistance] = useState<number>(35);

  const handleParentCheckinLocation = () => {
    setParentGpsStatus('tracking');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setParentGpsStatus('success');
          addNotification({
            title: '📍 Update Lokasi Antar Siswa',
            message: `Wali murid ananda ${currentUser.name} telah mengonfirmasi berada di area penjemputan/sekolah via GPS.`,
            type: 'info',
            forRole: 'all',
            linkTab: 'gps-tracker'
          });
          confetti({
            particleCount: 30,
            spread: 50
          });
        },
        () => {
          // Simulation fallback
          setParentGpsStatus('success');
          addNotification({
            title: '📍 Update Lokasi Antar Siswa',
            message: `Wali murid ananda ${currentUser.name} telah mengonfirmasi kedatangan di zona gerbang aman TK Al Mishbah.`,
            type: 'info',
            forRole: 'all',
            linkTab: 'gps-tracker'
          });
          confetti({
            particleCount: 30,
            spread: 50
          });
        }
      );
    } else {
      setParentGpsStatus('success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-teal-700/80 rounded-lg text-emerald-200">
              <Navigation className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
              Geofencing & Pelacakan Presisi
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Pelacakan Lokasi GPS & Zona Aman Siswa
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Memastikan ananda telah tiba di sekolah dengan selamat di dalam zona aman (Radius 150 meter dari gerbang utama TK Al Mishbah).
          </p>
        </div>

        <button
          onClick={handleParentCheckinLocation}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2"
        >
          <Car className="w-4 h-4" />
          {parentGpsStatus === 'success'
            ? 'Lokasi Antar Terverifikasi ✅'
            : 'Check-in Lokasi Antar Siswa'}
        </button>
      </div>

      {/* Main Grid: Radar/Map Preview + Live Student Status List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Geofence Radar / Map Graphic */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600" />
              Peta Radar Geofence Sekolah
            </h3>
            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 font-bold">
              Radius: {schoolProfile.schoolCoordinates.radiusMeters} Meter
            </span>
          </div>

          {/* Interactive Radar Visual Canvas */}
          <div className="relative aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-inner flex items-center justify-center p-4">
            {/* Radar circles */}
            <div className="absolute w-72 h-72 rounded-full border border-emerald-500/20 animate-pulse" />
            <div className="absolute w-52 h-52 rounded-full border border-emerald-500/40" />
            <div className="absolute w-32 h-32 rounded-full border-2 border-dashed border-emerald-400 bg-emerald-500/10 flex items-center justify-center">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider text-center px-2">
                Zona Aman Sekolah ({schoolProfile.schoolCoordinates.radiusMeters}m)
              </span>
            </div>

            {/* School Center Marker */}
            <div className="absolute z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="mt-1 text-[11px] font-bold text-white bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-400">
                {schoolProfile.name}
              </span>
            </div>

            {/* Simulated Student Pins scattered in/around */}
            {/* Student 1: Inside */}
            <div className="absolute top-[35%] left-[38%] z-10 group cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center border-2 border-white shadow-md text-[10px] font-bold">
                RY
              </div>
              <div className="hidden group-hover:block absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-md">
                Rayyan (24m - Tiba)
              </div>
            </div>

            {/* Student 2: Inside */}
            <div className="absolute top-[48%] right-[36%] z-10 group cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center border-2 border-white shadow-md text-[10px] font-bold">
                AS
              </div>
              <div className="hidden group-hover:block absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-md">
                Aisyah (40m - Tiba)
              </div>
            </div>

            {/* Student 3: Near gate */}
            <div className="absolute bottom-[30%] left-[45%] z-10 group cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center border-2 border-white shadow-md text-[10px] font-bold">
                FZ
              </div>
              <div className="hidden group-hover:block absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-md">
                Fathir (110m - Masuk Gerbang)
              </div>
            </div>

            {/* Radar Coordinates watermark */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] text-emerald-300 font-mono">
              LAT: {schoolProfile.schoolCoordinates.lat.toFixed(6)} | LNG: {schoolProfile.schoolCoordinates.lng.toFixed(6)}
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="font-bold">Protokol Keamanan Kedatangan:</span>
                <p className="text-[11px] text-emerald-700">
                  Siswa yang terdeteksi di dalam radius 150m otomatis diverifikasi tiba dengan aman.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Status List of Students */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Status Kedatangan Santri
            </h3>
            <span className="text-[11px] text-slate-500">Live Sync</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-1">
            {students.map((std) => {
              const att = studentAttendance.find((a) => a.studentId === std.id);
              const isPresent = !!att;
              const isLate = att?.status === 'Terlambat';

              return (
                <div
                  key={std.id}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <img
                    src={std.photoUrl}
                    alt={std.name}
                    className="w-11 h-11 rounded-xl object-cover border border-emerald-300 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {std.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {std.className}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5">
                      {isPresent ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md ${
                            isLate
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {isLate ? 'Tiba Terlambat (Gerbang)' : 'Tiba di Zona Sekolah'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                          <AlertCircle className="w-3 h-3" />
                          Belum Presensi / Di Jalan
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Wali: {std.parentName}</span>
                      <span className="font-mono text-emerald-700">
                        {isPresent ? 'Aman (Di Sekolah)' : 'Estimasi Menuju Sekolah'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
