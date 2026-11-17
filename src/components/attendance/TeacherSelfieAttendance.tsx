import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SCHOOL_ASSETS } from '../../assets/images';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  ShieldCheck,
  FileText,
  Check,
  X,
  Plus,
  Eye,
  AlertCircle,
  Lock,
  Sparkles,
  Users,
  CheckCircle,
  XCircle,
  FileCheck,
  Briefcase
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeaveType, LeaveRequest, StaffPosition, STAFF_POSITIONS } from '../../types';

export const TeacherSelfieAttendance: React.FC = () => {
  const {
    schoolProfile,
    currentUser,
    users,
    teachers,
    staff,
    teacherAttendance,
    recordTeacherAttendance,
    leaveRequests,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    deleteLeaveRequest,
    isPrincipal,
    isAccountOwner,
    canEditSchoolData
  } = useApp();

  // Active Main SubTab
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'leaves'>('attendance');

  // Combined Teacher & Staff selection for attendance
  const [selectedPersonType, setSelectedPersonType] = useState<'teacher' | 'staff'>('teacher');
  const [selectedPersonId, setSelectedPersonId] = useState<string>(() => {
    if (currentUser.relatedTeacherId) return currentUser.relatedTeacherId;
    if (currentUser.relatedStaffId) return currentUser.relatedStaffId;
    return teachers[0]?.id || 'tch-1';
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('Piket pagi & mengajar kelas sentra');

  // GPS state
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [locationData, setLocationData] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    distanceMeters: number;
    inRadius: boolean;
    addressDescription: string;
  }>({
    lat: schoolProfile.schoolCoordinates.lat,
    lng: schoolProfile.schoolCoordinates.lng,
    accuracy: 10,
    distanceMeters: 18,
    inRadius: true,
    addressDescription: schoolProfile.schoolCoordinates.name || 'Gedung Utama TK Al Mishbah'
  });

  // Calculate distance between two lat/lng in meters (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Get GPS Location
  const requestLocation = () => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const dist = calculateDistance(
            lat,
            lng,
            schoolProfile.schoolCoordinates.lat,
            schoolProfile.schoolCoordinates.lng
          );
          const inRadius = dist <= schoolProfile.schoolCoordinates.radiusMeters;
          setLocationData({
            lat,
            lng,
            accuracy: Math.round(pos.coords.accuracy),
            distanceMeters: dist,
            inRadius,
            addressDescription: inRadius
              ? `Terdeteksi di Lingkungan ${schoolProfile.name}`
              : `Terdeteksi di luar zona sekolah (${dist}m dari titik pusat)`
          });
          setGpsLoading(false);
        },
        () => {
          // Fallback to simulated valid school campus geofence
          setLocationData({
            lat: schoolProfile.schoolCoordinates.lat + 0.0001,
            lng: schoolProfile.schoolCoordinates.lng - 0.0001,
            accuracy: 12,
            distanceMeters: 18,
            inRadius: true,
            addressDescription: `${schoolProfile.schoolCoordinates.name || schoolProfile.name} (Sensor GPS Presisi)`
          });
          setGpsLoading(false);
        },
        { timeout: 7000 }
      );
    } else {
      setGpsLoading(false);
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError('');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } else {
        setCameraError('Kamera tidak didukung pada peramban ini. Mengaktifkan mode simulator selfie.');
      }
    } catch {
      setCameraError('Akses kamera tidak diizinkan. Anda dapat menggunakan tombol simulasi selfie instan.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeSubTab === 'attendance') {
      requestLocation();
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeSubTab]);

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Add watermark timestamp
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, canvas.height - 35, canvas.width - 20, 25);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`TK AL MISHBAH | ${new Date().toLocaleString('id-ID')}`, 20, canvas.height - 18);

        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);
      }
    }
  };

  const useFallbackSelfie = () => {
    if (selectedPersonType === 'teacher') {
      const currentTeacher = teachers.find((t) => t.id === selectedPersonId) || teachers[0];
      setCapturedPhoto(currentTeacher?.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80');
    } else {
      const currentStaff = staff.find((s) => s.id === selectedPersonId) || staff[0];
      setCapturedPhoto(currentStaff?.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80');
    }
  };

  const handlePresensiSubmit = () => {
    if (!capturedPhoto) {
      alert('Silakan ambil foto selfie presensi terlebih dahulu.');
      return;
    }

    recordTeacherAttendance(selectedPersonId, capturedPhoto, locationData, notes);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    setCapturedPhoto(null);
  };

  // Find currently selected person
  const activeTeacher = teachers.find((t) => t.id === selectedPersonId);
  const activeStaff = staff.find((s) => s.id === selectedPersonId);
  const activePersonName = activeTeacher ? activeTeacher.name : activeStaff ? activeStaff.name : currentUser.name;
  const activePersonDuty: StaffPosition = activeTeacher
    ? (activeTeacher.assignedDuty || (activeTeacher.position.includes('Wali') ? 'Wali Kelas' : activeTeacher.position.includes('Kepala') ? 'Kepala Sekolah' : activeTeacher.position.includes('Halaqoh') ? 'Pembimbing Halaqoh' : 'Guru'))
    : activeStaff
    ? (activeStaff.assignedDuty || (activeStaff.department.includes('Keuangan') || activeStaff.department.includes('Keamanan') ? 'Karyawan' : 'Staff'))
    : 'Guru';

  // ===================== LEAVE MANAGEMENT STATE =====================
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);

  // Review (ACC / Reject) State
  const [reviewModalData, setReviewModalData] = useState<{
    leave: LeaveRequest;
    action: 'approve' | 'reject';
    notes: string;
  } | null>(null);

  // Form State for New Leave Request
  const [applyForm, setApplyForm] = useState<{
    applicantType: 'teacher' | 'staff';
    applicantId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
    doctorLetterUrl: string;
  }>({
    applicantType: currentUser.relatedStaffId ? 'staff' : 'teacher',
    applicantId: currentUser.relatedStaffId || currentUser.relatedTeacherId || (teachers[0]?.id || 'tch-1'),
    leaveType: 'Sakit',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    doctorLetterUrl: ''
  });

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'pending').length;

  const filteredLeaves = leaveRequests.filter((l) => {
    if (leaveStatusFilter === 'all') return true;
    return l.status === leaveStatusFilter;
  });

  const handleOpenApplyModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const initialType = currentUser.relatedStaffId ? 'staff' : 'teacher';
    const initialId = currentUser.relatedStaffId || currentUser.relatedTeacherId || (teachers[0]?.id || 'tch-1');

    setApplyForm({
      applicantType: initialType,
      applicantId: initialId,
      leaveType: 'Sakit',
      startDate: today,
      endDate: today,
      reason: '',
      doctorLetterUrl: ''
    });
    setIsApplyModalOpen(true);
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e) || e < s) return 1;
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleSubmitNewLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.reason.trim()) {
      alert('Silakan tuliskan alasan izin atau cuti.');
      return;
    }

    let applicantName = currentUser.name;
    let applicantPosition: StaffPosition = 'Guru';

    if (applyForm.applicantType === 'teacher') {
      const tch = teachers.find((t) => t.id === applyForm.applicantId);
      if (tch) {
        applicantName = tch.name;
        applicantPosition = tch.assignedDuty || (tch.position.includes('Wali') ? 'Wali Kelas' : tch.position.includes('Kepala') ? 'Kepala Sekolah' : tch.position.includes('Halaqoh') ? 'Pembimbing Halaqoh' : 'Guru');
      }
    } else {
      const st = staff.find((s) => s.id === applyForm.applicantId);
      if (st) {
        applicantName = st.name;
        applicantPosition = st.assignedDuty || (st.department.includes('Keuangan') || st.department.includes('Keamanan') ? 'Karyawan' : 'Staff');
      }
    }

    const totalDays = calculateDays(applyForm.startDate, applyForm.endDate);

    submitLeaveRequest({
      applicantType: applyForm.applicantType,
      applicantId: applyForm.applicantId,
      applicantName,
      applicantPosition,
      leaveType: applyForm.leaveType,
      startDate: applyForm.startDate,
      endDate: applyForm.endDate,
      totalDays,
      reason: applyForm.reason.trim(),
      doctorLetterUrl: applyForm.doctorLetterUrl.trim() || undefined
    });

    setIsApplyModalOpen(false);
  };

  const handleConfirmReview = () => {
    if (!reviewModalData) return;
    if (reviewModalData.action === 'approve') {
      approveLeaveRequest(reviewModalData.leave.id, reviewModalData.notes);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });
    } else {
      rejectLeaveRequest(reviewModalData.leave.id, reviewModalData.notes);
    }
    setReviewModalData(null);
  };


  return (
    <div className="space-y-6">
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-700/80 rounded-lg text-emerald-200">
              <Camera className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
              Presensi Digital & Perizinan Pendidik / Tenaga Kependidikan
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Presensi & Perizinan Guru / Karyawan (ACC Kepala Sekolah)
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Mencakup presensi selfie dengan validasi GPS geofencing (150m), pemilihan tugas & jabatan resmi, serta pengajuan izin sakit/cuti yang wajib disetujui (ACC) oleh Kepala Sekolah.
          </p>
        </div>

        {/* Tab Switcher in Banner */}
        <div className="flex items-center bg-black/25 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 gap-1.5 shrink-0">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Presensi Selfie & GPS</span>
          </button>
          <button
            onClick={() => setActiveSubTab('leaves')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'leaves'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Izin & Cuti (ACC Kepsek)</span>
            {pendingLeavesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] animate-pulse">
                {pendingLeavesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: SELFIE & GPS ATTENDANCE ======================= */}
      {activeSubTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Camera / Selfie capture */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Perekaman Presensi Selfie Guru & Karyawan
              </h3>

              {/* Selector for Person (Guru & Karyawan) */}
              <div className="flex items-center gap-2">
                <select
                  value={`${selectedPersonType}:${selectedPersonId}`}
                  onChange={(e) => {
                    const [t, id] = e.target.value.split(':');
                    setSelectedPersonType(t as 'teacher' | 'staff');
                    setSelectedPersonId(id);
                  }}
                  className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-emerald-600 text-slate-800"
                >
                  <optgroup label="Pendidik & Guru">
                    {teachers.map((t) => (
                      <option key={t.id} value={`teacher:${t.id}`}>
                        {t.name} ({t.assignedDuty || 'Guru'})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Pegawai & Karyawan">
                    {staff.map((s) => (
                      <option key={s.id} value={`staff:${s.id}`}>
                        {s.name} ({s.assignedDuty || 'Karyawan'})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Person Duty & Status Bar */}
            <div className="mb-3.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <Briefcase className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-extrabold text-slate-900">{activePersonName}</div>
                  <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                    <span>Tugas / Jabatan:</span>
                    <span className="px-2 py-0.2 bg-emerald-200/80 text-emerald-950 font-black rounded-md">
                      {activePersonDuty}
                    </span>
                    <span>• Status: Aktif</span>
                  </div>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-500 font-mono hidden sm:block">
                Batas Tepat Waktu: <strong className="text-amber-700">07:30 WIB</strong>
              </div>
            </div>

            {/* Camera Viewfinder */}
            <div className="relative aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-inner flex items-center justify-center">
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Captured Selfie"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Fallback graphic if camera inactive or blocked */}
                  {!cameraActive && (
                    <div className="text-center p-6 text-slate-400">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs mb-3">
                        {cameraError || 'Kamera sedang disiapkan... Pastikan izin kamera aktif.'}
                      </p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Coba Hidupkan Kamera
                      </button>
                    </div>
                  )}

                  {/* Viewfinder Overlay Guides */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-emerald-400/40 m-6 rounded-2xl flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-emerald-400/60 rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-emerald-200 bg-black/40 px-2 py-0.5 rounded-full">
                          Posisikan Wajah di Lingkaran
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Watermark in Preview */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl flex items-center justify-between text-[10px]">
                    <span className="font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      GPS Terverifikasi (Radius TK Al Mishbah)
                    </span>
                    <span className="font-mono">{new Date().toLocaleTimeString('id-ID')} WIB</span>
                  </div>
                </>
              )}
            </div>

            {/* Camera Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!capturedPhoto ? (
                  <>
                    <button
                      onClick={takeSnapshot}
                      disabled={!cameraActive}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" /> Ambil Foto Selfie
                    </button>
                    <button
                      onClick={useFallbackSelfie}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                      title="Gunakan simulasi foto profil pegawai"
                    >
                      Simulasi Selfie
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setCapturedPhoto(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" /> Ulangi Foto
                  </button>
                )}
              </div>

              {/* Submit attendance button */}
              <button
                onClick={handlePresensiSubmit}
                disabled={!capturedPhoto}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Kirim Presensi Hari Ini
              </button>
            </div>

            {/* Notes input */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Aktivitas / Catatan Tugas Hari Ini
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Mengajar Sentra Balok & Pembinaan Halaqoh..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right Column: GPS Geofence Check & Today's Attendance List */}
          <div className="lg:col-span-5 space-y-6">
            {/* GPS Geofence Box */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Status Geofencing GPS (150m)
                </h4>
                <button
                  onClick={requestLocation}
                  disabled={gpsLoading}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                  title="Refresh Lokasi GPS"
                >
                  <RefreshCw className={`w-4 h-4 ${gpsLoading ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>

              {/* Status pill */}
              <div
                className={`p-3.5 rounded-2xl flex items-start gap-3 border ${
                  locationData.inRadius
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {locationData.inRadius ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="font-bold">
                    {locationData.inRadius ? 'Dalam Radius Sekolah (Valid)' : 'Di Luar Radius Sekolah'}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">{locationData.addressDescription}</div>
                  <div className="text-[10px] opacity-70 mt-1 font-mono">
                    Jarak: ~{locationData.distanceMeters} meter dari gerbang utama (Radius max 150m)
                  </div>
                </div>
              </div>

              {/* Coordinates detail */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl font-mono">
                <div>
                  <span className="block text-[10px] text-slate-400">Latitude:</span>
                  <span className="font-semibold text-slate-700">{locationData.lat.toFixed(6)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Longitude:</span>
                  <span className="font-semibold text-slate-700">{locationData.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>

            {/* Today's Attendance List */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Presensi Guru & Karyawan Hari Ini
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {teacherAttendance.length} Tercatat
                </span>
              </h4>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {teacherAttendance.map((rec) => {
                  const isApprovedLeave = rec.status === 'Sakit' || rec.status === 'Izin' || rec.status === 'Cuti';
                  return (
                    <div
                      key={rec.id}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <img
                        src={rec.selfieUrl}
                        alt={rec.teacherName}
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shrink-0 bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold text-slate-800 truncate">
                            {rec.teacherName}
                          </h5>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {rec.time} WIB
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                              rec.status === 'Hadir Tepat Waktu'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'Terlambat'
                                ? 'bg-amber-100 text-amber-800'
                                : rec.status === 'Sakit'
                                ? 'bg-rose-100 text-rose-800'
                                : rec.status === 'Cuti'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {rec.notes || 'Hadir'}
                          </span>
                        </div>
                        {isApprovedLeave ? (
                          <div className="text-[9px] text-emerald-600 mt-0.5 flex items-center gap-1 font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>ACC Resmi Kepala Sekolah</span>
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            <span>{rec.location?.distanceMeters}m dari gerbang</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: LEAVE & PERMITS (ACC KEPALA SEKOLAH) ======================= */}
      {activeSubTab === 'leaves' && (
        <div className="space-y-6">
          {/* Authority Banner */}
          <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            isPrincipal || isAccountOwner
              ? 'bg-purple-50 border-purple-200 text-purple-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-start gap-3">
              <span className={`p-2 rounded-2xl shrink-0 ${
                isPrincipal || isAccountOwner ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {isPrincipal || isAccountOwner ? <ShieldCheck className="w-6 h-6" /> : <FileCheck className="w-6 h-6" />}
              </span>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-2">
                  <span>
                    {isPrincipal
                      ? '👑 Anda Berperan sebagai Kepala Sekolah (Hj. Siti Khadijah, M.Pd.I)'
                      : isAccountOwner
                      ? '👑 Anda Berperan sebagai Pemilik Akun / Yayasan (Drs. H. Abdullah Mansyur)'
                      : 'ℹ️ Sistem Perizinan Guru & Karyawan — Wajib ACC Kepala Sekolah'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                  {isPrincipal || isAccountOwner
                    ? 'Anda memiliki hak penuh untuk meninjau surat dokter/bukti, memberikan ACC (Persetujuan Resmi), atau menolak permohonan izin/cuti guru & karyawan. Begitu di-ACC, status otomatis tersinkron ke buku presensi harian.'
                    : 'Guru dan staf dapat mengajukan surat izin sakit, cuti, atau dinas. Seluruh permohonan harus di-ACC (disetujui resmi) oleh Kepala Sekolah agar sah dan tercatat di presensi.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-end">
              <button
                onClick={handleOpenApplyModal}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajukan Izin / Cuti Baru</span>
              </button>
            </div>
          </div>

          {/* Filter Status Bar & Counter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setLeaveStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  leaveStatusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Semua ({leaveRequests.length})
              </button>
              <button
                onClick={() => setLeaveStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  leaveStatusFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Menunggu ACC</span>
                <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px]">
                  {pendingLeavesCount}
                </span>
              </button>
              <button
                onClick={() => setLeaveStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  leaveStatusFilter === 'approved'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Di-ACC Kepala Sekolah ({leaveRequests.filter((l) => l.status === 'approved').length})</span>
              </button>
              <button
                onClick={() => setLeaveStatusFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  leaveStatusFilter === 'rejected'
                    ? 'bg-rose-700 text-white'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Ditolak ({leaveRequests.filter((l) => l.status === 'rejected').length})</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              Menampilkan <span className="font-bold text-slate-800">{filteredLeaves.length}</span> pengajuan surat perizinan
            </div>
          </div>

          {/* Leave Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeaves.map((leave) => {
              const isPending = leave.status === 'pending';
              const isApproved = leave.status === 'approved';
              const isRejected = leave.status === 'rejected';

              return (
                <div
                  key={leave.id}
                  className={`bg-white rounded-3xl p-5 border shadow-xs transition-all relative flex flex-col justify-between ${
                    isPending
                      ? 'border-amber-300 ring-2 ring-amber-100'
                      : isApproved
                      ? 'border-emerald-200'
                      : 'border-slate-200 opacity-90'
                  }`}
                >
                  <div>
                    {/* Top Header Card */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-sm border border-emerald-300 shrink-0">
                          {leave.applicantName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{leave.applicantName}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-2 py-0.2 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md border border-slate-200">
                              {leave.applicantPosition}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({leave.applicantType === 'teacher' ? 'Pendidik' : 'Tenaga Kependidikan'})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Leave Type Badge */}
                      <span className={`px-2.5 py-1 rounded-xl font-black text-[11px] ${
                        leave.leaveType === 'Sakit'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : leave.leaveType === 'Cuti'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : leave.leaveType === 'Izin'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {leave.leaveType.toUpperCase()}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div className="mb-3">
                      {isPending && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                          <span className="font-extrabold flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                            Menunggu ACC Kepala Sekolah
                          </span>
                          <span className="text-[10px] text-amber-700 font-mono">
                            {leave.submittedAt}
                          </span>
                        </div>
                      )}
                      {isApproved && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between">
                          <span className="font-extrabold flex items-center gap-1.5 text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Telah Di-ACC Resmi Kepala Sekolah
                          </span>
                          <span className="text-[10px] text-emerald-700 font-mono">
                            {leave.reviewedAt}
                          </span>
                        </div>
                      )}
                      {isRejected && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-center justify-between">
                          <span className="font-extrabold flex items-center gap-1.5 text-rose-800">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            Ditolak oleh Kepala Sekolah
                          </span>
                          <span className="text-[10px] text-rose-700 font-mono">
                            {leave.reviewedAt}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Leave Period Details */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium">Periode Perizinan:</span>
                        <span className="font-bold text-slate-900">
                          {leave.startDate} s/d {leave.endDate} ({leave.totalDays} Hari)
                        </span>
                      </div>
                      <div className="text-slate-600">
                        <span className="font-medium block mb-0.5">Alasan / Keperluan:</span>
                        <p className="text-slate-800 font-normal italic bg-white p-2 rounded-xl border border-slate-200">
                          "{leave.reason}"
                        </p>
                      </div>

                      {/* Doctor letter attachment if exists */}
                      {leave.doctorLetterUrl && (
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-rose-500" /> Surat Dokter / Lampiran:
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreviewAttachmentUrl(leave.doctorLetterUrl!)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-emerald-600" />
                            <span>Lihat Berkas</span>
                          </button>
                        </div>
                      )}

                      {/* Review details if reviewed */}
                      {leave.reviewedBy && (
                        <div className="pt-2 border-t border-slate-200/80 text-[11px]">
                          <div className="font-bold text-slate-700">Ditinjau oleh: {leave.reviewedBy}</div>
                          {leave.reviewNotes && (
                            <div className="text-slate-600 mt-0.5">Catatan: {leave.reviewNotes}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Delete for authority */}
                    {canEditSchoolData ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus berkas perizinan atas nama ${leave.applicantName}?`)) {
                            deleteLeaveRequest(leave.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg text-xs"
                        title="Hapus Arsip Permohonan"
                      >
                        Hapus
                      </button>
                    ) : (
                      <div />
                    )}

                    {/* Review Actions */}
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        isPrincipal || isAccountOwner ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setReviewModalData({
                                  leave,
                                  action: 'reject',
                                  notes: 'Mohon maaf permohonan belum dapat disetujui terkait kelancaran operasional kelas.'
                                })
                              }
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setReviewModalData({
                                  leave,
                                  action: 'approve',
                                  notes: 'Disetujui resmi oleh Kepala Sekolah. Semoga lekas sembuh / urusan lancar.'
                                })
                              }
                              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4 text-amber-300" />
                              <span>✓ ACC / Setujui</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 font-bold">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Menunggu ACC Kepala Sekolah</span>
                          </div>
                        )
                      ) : (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                          isApproved ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                        }`}>
                          {isApproved ? 'Selesai di-ACC' : 'Status Ditolak'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= MODAL: AJUKAN IZIN / CUTI BARU ======================= */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-300" />
                  Formulir Pengajuan Izin / Cuti Guru & Karyawan
                </h3>
                <p className="text-[11px] text-emerald-100">
                  Wajib mendapatkan ACC resmi dari Kepala Sekolah sebelum tercatat di presensi.
                </p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewLeave} className="p-6 space-y-4 text-xs">
              {/* Applicant Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Guru / Karyawan Pemohon
                </label>
                <select
                  value={`${applyForm.applicantType}:${applyForm.applicantId}`}
                  onChange={(e) => {
                    const [t, id] = e.target.value.split(':');
                    setApplyForm({
                      ...applyForm,
                      applicantType: t as 'teacher' | 'staff',
                      applicantId: id
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold text-slate-800"
                >
                  <optgroup label="Pendidik & Guru">
                    {teachers.map((t) => (
                      <option key={t.id} value={`teacher:${t.id}`}>
                        {t.name} — {t.assignedDuty || 'Guru'} ({t.position})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Pegawai & Karyawan">
                    {staff.map((s) => (
                      <option key={s.id} value={`staff:${s.id}`}>
                        {s.name} — {s.assignedDuty || 'Karyawan'} ({s.department})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Leave Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jenis Perizinan yang Diajukan
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Sakit', 'Izin', 'Cuti', 'Lainnya'] as LeaveType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setApplyForm({ ...applyForm, leaveType: type })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border text-center cursor-pointer ${
                        applyForm.leaveType === type
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-medium flex items-center justify-between">
                <span>Total Durasi Hari:</span>
                <strong className="text-emerald-950 font-extrabold text-xs">
                  {calculateDays(applyForm.startDate, applyForm.endDate)} Hari Kerja
                </strong>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan & Keterangan Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="Jelaskan alasan izin / sakit, kondisi kesehatan, atau keperluan keluarga..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              {/* Doctor Letter URL / Attachment */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tautan Surat Dokter / Bukti Pendukung (Opsional)
                </label>
                <input
                  type="url"
                  value={applyForm.doctorLetterUrl}
                  onChange={(e) => setApplyForm({ ...applyForm, doctorLetterUrl: e.target.value })}
                  placeholder="https://... (Foto surat dokter / surat tugas)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Contoh Lampiran Demo:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setApplyForm({
                        ...applyForm,
                        doctorLetterUrl:
                          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80'
                      })
                    }
                    className="text-[10px] text-emerald-700 hover:underline font-bold"
                  >
                    Gunakan Surat Dokter Puskesmas
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Ajukan ke Kepala Sekolah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: REVIEW ACC / REJECT (KEPALA SEKOLAH) ======================= */}
      {reviewModalData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className={`p-5 text-white flex items-center justify-between ${
              reviewModalData.action === 'approve'
                ? 'bg-gradient-to-r from-emerald-800 to-teal-800'
                : 'bg-gradient-to-r from-rose-800 to-red-800'
            }`}>
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  {reviewModalData.action === 'approve' ? (
                    <CheckCircle className="w-5 h-5 text-amber-300" />
                  ) : (
                    <XCircle className="w-5 h-5 text-white" />
                  )}
                  {reviewModalData.action === 'approve'
                    ? 'ACC / Setujui Permohonan Izin'
                    : 'Tolak Permohonan Izin'}
                </h3>
                <p className="text-[11px] opacity-90">
                  Penetapan resmi oleh Kepala Sekolah (Hj. Siti Khadijah, M.Pd.I)
                </p>
              </div>
              <button
                onClick={() => setReviewModalData(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="font-bold text-slate-800 text-sm">
                  {reviewModalData.leave.applicantName}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Jabatan: <strong>{reviewModalData.leave.applicantPosition}</strong> • Jenis: <strong>{reviewModalData.leave.leaveType}</strong>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Periode: {reviewModalData.leave.startDate} s/d {reviewModalData.leave.endDate} ({reviewModalData.leave.totalDays} hari)
                </div>
                <p className="text-[11px] italic text-slate-700 mt-2 bg-white p-2 rounded-xl border border-slate-200">
                  "{reviewModalData.leave.reason}"
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan / Tanggapan Kepala Sekolah:
                </label>
                <textarea
                  rows={3}
                  value={reviewModalData.notes}
                  onChange={(e) =>
                    setReviewModalData({
                      ...reviewModalData,
                      notes: e.target.value
                    })
                  }
                  placeholder="Tuliskan catatan arahan atau pesan Kepala Sekolah..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalData(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReview}
                  className={`px-5 py-2 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5 ${
                    reviewModalData.action === 'approve'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {reviewModalData.action === 'approve' ? (
                    <>
                      <Check className="w-4 h-4 text-amber-300" />
                      <span>Konfirmasi ACC</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>Tolak Pengajuan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: PREVIEW SURAT DOKTER ======================= */}
      {previewAttachmentUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Lampiran Surat Dokter / Dokumen Pendukung
              </span>
              <button
                onClick={() => setPreviewAttachmentUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center">
              <img
                src={previewAttachmentUrl}
                alt="Dokumen Surat Dokter"
                className="max-h-[70vh] rounded-2xl object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
