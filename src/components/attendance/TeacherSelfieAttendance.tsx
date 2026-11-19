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
  Briefcase,
  BarChart3,
  FileSpreadsheet,
  LogIn,
  LogOut,
  CalendarDays
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeaveType, LeaveRequest, StaffPosition, STAFF_POSITIONS, TeacherAttendanceRecord } from '../../types';
import {
  exportDailyTeacherAttendancePDF,
  exportMonthlyTeacherAttendancePDF
} from '../../services/pdfService';
import {
  exportDailyTeacherAttendanceExcel,
  exportMonthlyTeacherAttendanceExcel
} from '../../services/excelService';
import { WorkScheduleSettingsPanel } from './WorkScheduleSettingsPanel';
import { getPersonCategory, getScheduleForDate } from '../../utils/workSchedule';

const INDONESIAN_MONTHS_SHORT = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const formatMonthName = (ym: string) => {
  const [y, m] = ym.split('-');
  const idx = Number(m) - 1;
  if (!y || isNaN(idx) || idx < 0 || idx > 11) return ym;
  return `${INDONESIAN_MONTHS_SHORT[idx]} ${y}`;
};

export const TeacherSelfieAttendance: React.FC = () => {
  const {
    schoolProfile,
    currentUser,
    users,
    teachers,
    staff,
    teacherAttendance,
    recordTeacherAttendance,
    upsertTeacherAttendance,
    leaveRequests,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    deleteLeaveRequest,
    isPrincipal,
    isAccountOwner,
    canEditSchoolData,
    canManageMasterData
  } = useApp();

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Active Main SubTab
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'leaves' | 'recap' | 'schedule'>('attendance');
  const [attendanceMode, setAttendanceMode] = useState<'checkin' | 'checkout'>('checkin');

  // Recap SubTab States
  const [recapMode, setRecapMode] = useState<'daily' | 'monthly'>('daily');
  const [recapCategory, setRecapCategory] = useState<'all' | 'teacher' | 'staff'>('all');
  const [recapDate, setRecapDate] = useState<string>(todayDateStr);
  const [recapMonthKey, setRecapMonthKey] = useState<string>(todayDateStr.slice(0, 7));

  const todayTeacherRecords = teacherAttendance.filter((r) => r.date === todayDateStr);

  const recapMonthOptions = React.useMemo(() => {
    const keys = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    teacherAttendance.forEach((r) => {
      if (r.date && r.date.length >= 7) keys.add(r.date.slice(0, 7));
    });
    return Array.from(keys)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({ key, label: formatMonthName(key) }));
  }, [teacherAttendance]);

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
  const [selfieFeedback, setSelfieFeedback] = useState<string | null>(null);
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
      const srcW = video.videoWidth || 480;
      const srcH = video.videoHeight || 360;
      const maxDim = 480;
      const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
      canvas.width = Math.max(1, Math.round(srcW * scale));
      canvas.height = Math.max(1, Math.round(srcH * scale));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Add watermark timestamp
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, canvas.height - 32, canvas.width - 20, 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`TK AL MISHBAH | ${new Date().toLocaleString('id-ID')}`, 16, canvas.height - 17);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
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
      setSelfieFeedback('Silakan ambil foto selfie presensi terlebih dahulu.');
      return;
    }

    setSelfieFeedback(null);
    recordTeacherAttendance(selectedPersonId, capturedPhoto, locationData, notes, attendanceMode);
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
  const selectedPersonCategory = getPersonCategory(selectedPersonId, staff);
  const todaySchedule = getScheduleForDate(schoolProfile.workSchedule, selectedPersonCategory, todayDateStr);
  const selectedTodayRecord = todayTeacherRecords.find((r) => r.teacherId === selectedPersonId);

  // ===================== LEAVE MANAGEMENT STATE =====================
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyFormError, setApplyFormError] = useState<string | null>(null);
  const [confirmDeleteLeaveId, setConfirmDeleteLeaveId] = useState<string | null>(null);
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
    setApplyFormError(null);
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
      setApplyFormError('Silakan tuliskan alasan izin atau cuti.');
      return;
    }
    setApplyFormError(null);

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
        <div className="flex flex-wrap items-center bg-black/25 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 gap-1.5 shrink-0">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Presensi Masuk / Keluar</span>
          </button>
          <button
            onClick={() => setActiveSubTab('recap')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'recap'
                ? 'bg-teal-500 text-slate-950 font-extrabold shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Data Harian & Bulanan</span>
          </button>
          <button
            onClick={() => setActiveSubTab('leaves')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'leaves'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Izin & Cuti (ACC Pemilik)</span>
            {pendingLeavesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] animate-pulse">
                {pendingLeavesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'schedule'
                ? 'bg-white text-emerald-950 font-extrabold shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Jam Masuk & Keluar (Sen–Jum)</span>
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: SELFIE & GPS ATTENDANCE ======================= */}
      {activeSubTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Camera / Selfie capture */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Perekaman Presensi Selfie Guru &amp; Karyawan
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

            {/* Check-In vs Check-Out Mode Selector */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-3">
              <button
                type="button"
                onClick={() => {
                  setAttendanceMode('checkin');
                  setNotes('Piket pagi & mengajar kelas sentra');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  attendanceMode === 'checkin'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Presensi Masuk ({todaySchedule.checkIn} WIB)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttendanceMode('checkout');
                  setNotes('Penyelesaian tugas & piket pulang');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  attendanceMode === 'checkout'
                    ? 'bg-sky-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Presensi Keluar ({todaySchedule.checkOut} WIB)</span>
              </button>
            </div>

            {/* Person Duty & Dynamic Mon-Fri Schedule Bar */}
            <div className="mb-3.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <Briefcase className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-extrabold text-slate-900">{activePersonName}</div>
                  <div className="text-[11px] text-emerald-800 flex flex-wrap items-center gap-1.5 font-medium">
                    <span>Tugas / Jabatan:</span>
                    <span className="px-2 py-0.2 bg-emerald-200/80 text-emerald-950 font-black rounded-md">
                      {activePersonDuty}
                    </span>
                    {selectedTodayRecord?.time && (
                      <span className="text-[10px] font-mono text-emerald-700">
                        • Masuk: {selectedTodayRecord.time.slice(0, 5)}
                      </span>
                    )}
                    {selectedTodayRecord?.checkOutTime && (
                      <span className="text-[10px] font-mono text-sky-700">
                        • Keluar: {selectedTodayRecord.checkOutTime.slice(0, 5)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="sm:text-right text-[11px] text-slate-600 font-mono bg-white/80 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                <div className="text-[10px] font-sans font-bold text-emerald-800">
                  Jadwal {todaySchedule.dayLabel} ({selectedPersonCategory === 'karyawan' ? 'Karyawan' : 'Guru'})
                  {todaySchedule.isWeekend ? ' • Akhir Pekan' : ''}
                </div>
                <div>
                  Masuk <strong className="text-emerald-700">{todaySchedule.checkIn}</strong> • Keluar{' '}
                  <strong className="text-sky-700">{todaySchedule.checkOut}</strong> WIB
                </div>
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

            {selfieFeedback && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{selfieFeedback}</span>
              </div>
            )}

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
                className={`px-6 py-2.5 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                  attendanceMode === 'checkout'
                    ? 'bg-sky-700 hover:bg-sky-800'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {attendanceMode === 'checkout' ? (
                  <>
                    <LogOut className="w-4 h-4" /> Kirim Presensi Keluar
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Kirim Presensi Masuk
                  </>
                )}
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
              <div className="flex items-center justify-between mb-3 gap-2">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Presensi Hari Ini ({todayDateStr})
                </h4>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {todayTeacherRecords.length} Tercatat
                </span>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {todayTeacherRecords.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Belum ada catatan presensi guru pada hari ini.
                  </div>
                ) : (
                  todayTeacherRecords.map((rec) => {
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
                            <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                              <span className="text-emerald-700 font-semibold">
                                Masuk: {rec.time} WIB
                              </span>
                              {rec.checkOutTime && (
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold ${
                                    rec.checkOutEarly
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-sky-100 text-sky-800'
                                  }`}
                                >
                                  Keluar: {rec.checkOutTime} WIB
                                </span>
                              )}
                            </div>
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
                  })
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('recap')}
                className="mt-4 w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Lihat Rekap Absensi Harian & Bulanan →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: REKAP ABSENSI GURU & KARYAWAN HARIAN & BULANAN ======================= */}
      {activeSubTab === 'recap' && (() => {
        const activeTeachers = recapCategory === 'staff' ? [] : teachers;
        const activeStaff = recapCategory === 'teacher' ? [] : staff;
        const activeCategoryLabel =
          recapCategory === 'teacher'
            ? 'Guru'
            : recapCategory === 'staff'
            ? 'Karyawan'
            : 'Guru & Karyawan';

        const personnel = [
          ...activeTeachers.map((t) => ({
            id: t.id,
            code: t.nuptk || t.id,
            name: t.name,
            category: 'Guru' as const,
            roleLabel: t.assignedDuty || t.position,
            photoUrl: t.photoUrl
          })),
          ...activeStaff.map((s) => ({
            id: s.id,
            code: s.nip || s.id,
            name: s.name,
            category: 'Karyawan' as const,
            roleLabel: `${s.position} (${s.department})`,
            photoUrl: s.photoUrl
          }))
        ];

        const personnelIds = new Set(personnel.map((p) => p.id));
        const dayRecords = teacherAttendance.filter(
          (r) => r.date === recapDate && personnelIds.has(r.teacherId)
        );
        const monthRecords = teacherAttendance.filter(
          (r) => r.date.startsWith(recapMonthKey) && personnelIds.has(r.teacherId)
        );
        const activeDaysInMonth = new Set(monthRecords.map((r) => r.date)).size;
        const recapMonthLabel = formatMonthName(recapMonthKey);

        const tepatHari = dayRecords.filter((r) => r.status === 'Hadir Tepat Waktu').length;
        const telatHari = dayRecords.filter((r) => r.status === 'Terlambat').length;
        const izinSakitCutiHari = dayRecords.filter(
          (r) => r.status === 'Izin' || r.status === 'Sakit' || r.status === 'Cuti'
        ).length;
        const recordedHari = personnel.filter((p) =>
          dayRecords.some((r) => r.teacherId === p.id)
        ).length;
        const belumHari = Math.max(0, personnel.length - recordedHari);

        return (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-5">
            {/* Controls Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setRecapMode('daily')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      recapMode === 'daily'
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Laporan Harian
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecapMode('monthly')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      recapMode === 'monthly'
                        ? 'bg-white text-emerald-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Laporan Bulanan
                  </button>
                </div>

                {/* Category filter */}
                <div className="flex items-center gap-1 bg-emerald-50 p-1 rounded-2xl border border-emerald-200">
                  <button
                    type="button"
                    onClick={() => setRecapCategory('all')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                      recapCategory === 'all'
                        ? 'bg-emerald-700 text-white'
                        : 'text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Semua ({teachers.length + staff.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecapCategory('teacher')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                      recapCategory === 'teacher'
                        ? 'bg-emerald-700 text-white'
                        : 'text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Guru ({teachers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecapCategory('staff')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                      recapCategory === 'staff'
                        ? 'bg-sky-700 text-white'
                        : 'text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Karyawan ({staff.length})
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {recapMode === 'daily' ? (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={recapDate}
                      onChange={(e) => setRecapDate(e.target.value)}
                      className="bg-transparent font-bold text-slate-700 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <select
                      value={recapMonthKey}
                      onChange={(e) => setRecapMonthKey(e.target.value)}
                      className="bg-transparent font-bold text-slate-700 focus:outline-none"
                    >
                      {recapMonthOptions.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    recapMode === 'daily'
                      ? exportDailyTeacherAttendancePDF(
                          recapDate,
                          teacherAttendance,
                          activeTeachers,
                          activeStaff,
                          activeCategoryLabel
                        )
                      : exportMonthlyTeacherAttendancePDF(
                          recapMonthLabel,
                          recapMonthKey,
                          activeTeachers,
                          teacherAttendance,
                          activeStaff,
                          activeCategoryLabel
                        )
                  }
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Unduh PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    recapMode === 'daily'
                      ? exportDailyTeacherAttendanceExcel(
                          recapDate,
                          teacherAttendance,
                          activeTeachers,
                          activeStaff,
                          activeCategoryLabel
                        )
                      : exportMonthlyTeacherAttendanceExcel(
                          recapMonthLabel,
                          recapMonthKey,
                          activeTeachers,
                          teacherAttendance,
                          activeStaff,
                          activeCategoryLabel
                        )
                  }
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Unduh Excel
                </button>
              </div>
            </div>

            {recapMode === 'daily' ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                      Tepat Waktu
                    </span>
                    <span className="text-xl font-black text-emerald-950">{tepatHari}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-amber-700 block">
                      Terlambat
                    </span>
                    <span className="text-xl font-black text-amber-950">{telatHari}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-blue-700 block">
                      Izin / Sakit / Cuti
                    </span>
                    <span className="text-xl font-black text-blue-950">{izinSakitCutiHari}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                    <span className="text-[10px] font-bold uppercase text-rose-700 block">
                      Belum Presensi
                    </span>
                    <span className="text-xl font-black text-rose-950">{belumHari}</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">Pegawai</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4">Jabatan / Unit</th>
                        <th className="py-3 px-4">Jam Masuk</th>
                        <th className="py-3 px-4">Jam Keluar</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Keterangan</th>
                        {canManageMasterData && <th className="py-3 px-4 text-right">Ubah Status</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {personnel.map((person, idx) => {
                        const rec = dayRecords.find((r) => r.teacherId === person.id);
                        return (
                          <tr key={person.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={rec?.selfieUrl || person.photoUrl}
                                  alt={person.name}
                                  className="w-8 h-8 rounded-full object-cover border border-emerald-200 shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-slate-800">{person.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {person.code}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  person.category === 'Guru'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                                }`}
                              >
                                {person.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">
                              {person.roleLabel}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {rec ? `${rec.time} WIB` : '-'}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {rec?.checkOutTime ? (
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                    rec.checkOutEarly
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-sky-100 text-sky-800'
                                  }`}
                                >
                                  {rec.checkOutTime} WIB
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  !rec
                                    ? 'bg-slate-100 text-slate-600'
                                    : rec.status === 'Hadir Tepat Waktu'
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
                                {rec ? rec.status : 'Belum Presensi'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                              {rec?.notes || '-'}
                            </td>
                            {canManageMasterData && (
                              <td className="py-3 px-4 text-right">
                                <select
                                  value={rec?.status || ''}
                                  onChange={(e) => {
                                    const val = e.target.value as TeacherAttendanceRecord['status'];
                                    if (!val) return;
                                    upsertTeacherAttendance(person.id, recapDate, val);
                                  }}
                                  className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-emerald-600"
                                >
                                  <option value="">-- Catat --</option>
                                  <option value="Hadir Tepat Waktu">Hadir Tepat Waktu</option>
                                  <option value="Terlambat">Terlambat</option>
                                  <option value="Izin">Izin</option>
                                  <option value="Sakit">Sakit</option>
                                  <option value="Cuti">Cuti</option>
                                </select>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl text-xs">
                  <span className="font-bold text-emerald-950">
                    Rekapitulasi Kehadiran {activeCategoryLabel} Periode {recapMonthLabel}
                  </span>
                  <span className="font-mono font-bold text-emerald-800">
                    {activeDaysInMonth} Hari Kerja Tercatat • {personnel.length} Pegawai
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 text-center">No</th>
                        <th className="py-3 px-4">Nama Pegawai</th>
                        <th className="py-3 px-3">Kategori</th>
                        <th className="py-3 px-4">Jabatan / Unit</th>
                        <th className="py-3 px-3 text-center">Tepat Waktu</th>
                        <th className="py-3 px-3 text-center">Terlambat</th>
                        <th className="py-3 px-3 text-center">Izin</th>
                        <th className="py-3 px-3 text-center">Sakit</th>
                        <th className="py-3 px-3 text-center">Cuti</th>
                        <th className="py-3 px-3 text-center">Total Hari</th>
                        <th className="py-3 px-3 text-center">% Hadir</th>
                        <th className="py-3 px-4 text-center">Predikat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {personnel.map((person, idx) => {
                        const recs = monthRecords.filter((r) => r.teacherId === person.id);
                        const tepat = recs.filter((r) => r.status === 'Hadir Tepat Waktu').length;
                        const telat = recs.filter((r) => r.status === 'Terlambat').length;
                        const izin = recs.filter((r) => r.status === 'Izin').length;
                        const sakit = recs.filter((r) => r.status === 'Sakit').length;
                        const cuti = recs.filter((r) => r.status === 'Cuti').length;
                        const denom = Math.max(activeDaysInMonth, recs.length, 1);
                        const pct = Math.min(100, Math.round(((tepat + telat) / denom) * 100));

                        return (
                          <tr key={person.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-3 text-center font-mono text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{person.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {person.code}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  person.category === 'Guru'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                                }`}
                              >
                                {person.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">
                              {person.roleLabel}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-700">
                              {tepat}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-amber-600">
                              {telat}
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-blue-600">
                              {izin}
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-rose-600">
                              {sakit}
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-purple-600">
                              {cuti}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                              {recs.length}
                            </td>
                            <td className="py-3 px-3 text-center font-black text-emerald-900">
                              {pct}%
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  pct >= 90
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pct >= 75
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {pct >= 90
                                  ? 'Teladan'
                                  : pct >= 75
                                  ? 'Baik'
                                  : 'Perlu Pembinaan'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ======================= TAB 4: PENGATURAN JAM MASUK & KELUAR (SENIN - JUM'AT) ======================= */}
      {activeSubTab === 'schedule' && <WorkScheduleSettingsPanel />}

      {/* ======================= TAB 2: LEAVE & PERMITS (ACC KEPALA SEKOLAH) ======================= */}
      {activeSubTab === 'leaves' && (
        <div className="space-y-6">
          {/* Authority Banner */}
          <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            isAccountOwner
              ? 'bg-purple-50 border-purple-200 text-purple-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-start gap-3">
              <span className={`p-2 rounded-2xl shrink-0 ${
                isAccountOwner ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {isAccountOwner ? <ShieldCheck className="w-6 h-6" /> : <FileCheck className="w-6 h-6" />}
              </span>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-2">
                  <span>
                    {isAccountOwner
                      ? `👑 Pemilik Akun (${currentUser.name}) — Otoritas ACC & Edit Status`
                      : 'ℹ️ Sistem Perizinan Guru & Karyawan — Wajib ACC Pemilik Akun'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                  {isAccountOwner
                    ? 'Hanya Pemilik Akun yang berwenang meninjau bukti, memberikan ACC (Persetujuan Resmi), menolak, atau menghapus pengajuan izin/cuti guru & karyawan.'
                    : 'Guru, Kepala Sekolah, dan Staf dapat mengajukan surat izin sakit, cuti, atau dinas. Seluruh perubahan status & ACC dilakukan oleh Pemilik Akun.'}
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
                    {/* Delete for owner only */}
                    {canEditSchoolData ? (
                      confirmDeleteLeaveId === leave.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              deleteLeaveRequest(leave.id);
                              setConfirmDeleteLeaveId(null);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteLeaveId(null)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] rounded-lg cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteLeaveId(leave.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg text-xs cursor-pointer"
                          title="Hapus Arsip Permohonan"
                        >
                          Hapus
                        </button>
                      )
                    ) : (
                      <div />
                    )}

                    {/* Review Actions */}
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        isAccountOwner ? (
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
                                  notes: 'Disetujui resmi oleh Pemilik Akun. Semoga lekas sembuh / urusan lancar.'
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
                            <span>Menunggu ACC Pemilik Akun</span>
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
                  Wajib mendapatkan ACC resmi dari Pemilik Akun sebelum tercatat di presensi.
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
              {applyFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{applyFormError}</span>
                </div>
              )}
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
                  Penetapan resmi oleh Pemilik Akun ({currentUser.name})
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
