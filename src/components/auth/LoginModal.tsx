import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SCHOOL_ASSETS } from '../../assets/images';
import { getPortalAudienceFromUrl, PortalAudience } from '../../utils/portalLinks';
import {
  Lock,
  User as UserIcon,
  X,
  Check,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Users,
  Wifi
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoginFormCardProps {
  onSuccess?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  initialPortal?: PortalAudience;
}

const PORTAL_META: Record<
  PortalAudience,
  {
    badge: string;
    heading: string;
    description: string;
    placeholder: string;
    hint: string;
  }
> = {
  all: {
    badge: 'Portal Masuk Terproteksi',
    heading: 'Portal Masuk Terpadu',
    description:
      'Masukkan Nama Akun (atau Username/Email) dan Kata Sandi yang tersimpan di data sekolah untuk melanjutkan.',
    placeholder: 'Ketik nama akun atau username terdaftar...',
    hint: 'Mendukung akun Kepala Sekolah, Guru, Karyawan/Staf, maupun Orang Tua Murid.'
  },
  guru: {
    badge: 'Portal Khusus Guru & Pendidik',
    heading: 'Portal Masuk Guru',
    description:
      'Silakan masuk menggunakan Username dan Kata Sandi akun Guru / Ustadz / Ustadzah untuk presensi, absen siswa & halaqoh.',
    placeholder: 'Contoh username guru: ustadzah.fatimah',
    hint: 'Khusus Guru, Wali Kelas, dan Pembimbing Halaqoh Tahfidz.'
  },
  karyawan: {
    badge: 'Portal Khusus Karyawan & Staf',
    heading: 'Portal Masuk Karyawan',
    description:
      'Silakan masuk menggunakan Username dan Kata Sandi akun Karyawan / Tata Usaha untuk presensi, laporan & administrasi.',
    placeholder: 'Contoh username staf: admin.tu',
    hint: 'Khusus Staff Tata Usaha, Keuangan, Operasional & Keamanan.'
  },
  ortu: {
    badge: 'Portal Orang Tua / Wali Murid',
    heading: 'Portal Masuk Wali Murid',
    description:
      'Silakan masuk menggunakan Username dan Kata Sandi Orang Tua Murid untuk memantau absensi anak, tahfidz, SPP & chat guru.',
    placeholder: 'Contoh username wali murid: ortu.rayyan',
    hint: 'Gunakan username & kata sandi wali murid yang dibagikan oleh pihak sekolah.'
  }
};

const LoginFormCard: React.FC<LoginFormCardProps> = ({
  onSuccess,
  onClose,
  showCloseButton = false,
  initialPortal = 'all'
}) => {
  const { loginWithSync, schoolProfile, realtimeConnected, publishMeta } = useApp();
  const [selectedPortal, setSelectedPortal] = useState<PortalAudience>(initialPortal);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const portalInfo = PORTAL_META[selectedPortal];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      const ok = await loginWithSync(username, password);
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setUsername('');
          setPassword('');
          onSuccess?.();
        }, 450);
      } else {
        setError(
          'Nama akun, username, atau kata sandi tidak cocok dengan data yang tersimpan. Periksa kembali penulisan dan huruf besar/kecil kata sandi.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
      {/* Top school header */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-6 text-white text-center relative">
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <img
          src={schoolProfile?.logoUrl || SCHOOL_ASSETS.logo}
          alt="Logo"
          className="w-16 h-16 mx-auto rounded-full border-2 border-white/60 shadow-md mb-2 object-cover bg-white"
        />
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          {portalInfo.badge}
        </div>
        <h3 className="text-lg font-bold">{schoolProfile?.name || 'TK Islam Al Mishbah'}</h3>
        <p className="text-xs text-emerald-100 mt-1 leading-relaxed">{portalInfo.description}</p>
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/45 border border-emerald-400/25 text-[10px] font-semibold text-emerald-100">
          <Wifi className={`w-3 h-3 ${realtimeConnected ? 'text-emerald-300' : 'text-amber-300'}`} />
          <span>
            {realtimeConnected ? 'Sinkronisasi Portal Real-Time Aktif' : 'Sinkronisasi Portal Siap'}
            {publishMeta.publishedVersion > 0 ? ` • v${publishMeta.publishedVersion}` : ''}
          </span>
        </div>
      </div>

      {/* Role portal context selector tabs (guides user, always requires username + password) */}
      <div className="px-6 pt-4">
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setSelectedPortal('all')}
            className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
              selectedPortal === 'all'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span>Semua</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPortal('guru')}
            className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
              selectedPortal === 'guru'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3 h-3 shrink-0" />
            <span>Guru</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPortal('karyawan')}
            className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
              selectedPortal === 'karyawan'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3 h-3 shrink-0" />
            <span>Karyawan</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedPortal('ortu')}
            className={`py-1.5 px-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
              selectedPortal === 'ortu'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3 h-3 shrink-0" />
            <span>Ortu</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 pt-4">
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Autentikasi berhasil! Membuka ruang kerja Anda...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Akun / Username / Email
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                autoFocus
                autoComplete="username"
                placeholder={portalInfo.placeholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Masukkan kata sandi akun Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-65 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isSubmitting ? 'Memverifikasi & Menyinkronkan...' : 'Masuk ke Aplikasi'}</span>
          </button>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-1">
            {portalInfo.hint}
          </p>
        </form>
      </div>
    </div>
  );
};

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <LoginFormCard showCloseButton onClose={onClose} onSuccess={onClose} />
    </div>
  );
};

export const LoginScreen: React.FC = () => {
  const initialPortal = getPortalAudienceFromUrl();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 flex flex-col items-center justify-center p-4">
      <LoginFormCard showCloseButton={false} initialPortal={initialPortal} />
    </div>
  );
};
