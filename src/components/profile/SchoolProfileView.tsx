import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SCHOOL_ASSETS } from '../../assets/images';
import {
  School,
  Sparkles,
  Upload,
  Image,
  RefreshCw,
  Check,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  Save,
  Link,
  Compass,
  Lock,
  Crown,
  User,
  CheckCircle2,
  ArrowRight,
  Camera,
  KeyRound,
  Eye,
  EyeOff,
  Rocket,
  X,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PhotoUploadModal } from '../common/PhotoUploadModal';
import { GoogleMapsCoordinatePicker } from './GoogleMapsCoordinatePicker';
import { compressImageFile } from '../../utils/imageCompressor';

interface SchoolProfileViewProps {
  onOpenPublishModal?: () => void;
}

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({ onOpenPublishModal }) => {
  const {
    schoolProfile,
    updateSchoolProfile,
    currentUser,
    users,
    updateOwnerUser,
    canEditSchoolData,
    isAccountOwner,
    hasPendingChanges,
    publishMeta,
    autoSaveStatus
  } = useApp();

  const canEdit = canEditSchoolData;

  // Active Tab: School Identity vs Owner Management (Pemilik Baru)
  const [activeTab, setActiveTab] = useState<'school' | 'owner'>('school');

  // School Form state initialized from reactive schoolProfile
  const [name, setName] = useState(schoolProfile.name);
  const [motto, setMotto] = useState(schoolProfile.motto);
  const [logoUrl, setLogoUrl] = useState(schoolProfile.logoUrl);
  const [npsn, setNpsn] = useState(schoolProfile.npsn);
  const [address, setAddress] = useState(schoolProfile.address);
  const [phone, setPhone] = useState(schoolProfile.phone);
  const [email, setEmail] = useState(schoolProfile.email);
  const [principalName, setPrincipalName] = useState(schoolProfile.principalName);
  const [foundationName, setFoundationName] = useState(schoolProfile.foundationName || 'Yayasan Pendidikan Islam Al Mishbah');
  const [radiusMeters, setRadiusMeters] = useState(schoolProfile.schoolCoordinates.radiusMeters || 150);
  const [coordLat, setCoordLat] = useState(schoolProfile.schoolCoordinates.lat);
  const [coordLng, setCoordLng] = useState(schoolProfile.schoolCoordinates.lng);
  const [coordName, setCoordName] = useState(schoolProfile.schoolCoordinates.name || 'Gedung Utama TK Al Mishbah');

  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Find Current Account Owner User
  const currentOwner = users.find((u) => u.isOwner || u.role === 'owner') || currentUser;

  // Owner Replacement Form State
  const [ownerName, setOwnerName] = useState(currentOwner.name);
  const [ownerUsername, setOwnerUsername] = useState(currentOwner.username);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerPosition, setOwnerPosition] = useState(currentOwner.position || 'Pemilik Akun & Pembina Yayasan');
  const [ownerPhone, setOwnerPhone] = useState(currentOwner.phone || '0812-9988-7766');
  const [ownerEmail, setOwnerEmail] = useState(currentOwner.email || 'yayasan@tk-almishbah.sch.id');
  const [ownerAvatarUrl, setOwnerAvatarUrl] = useState(currentOwner.avatarUrl);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [ownerSavedAlert, setOwnerSavedAlert] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Preset mottos
  const presetMottos = [
    "Mencetak Generasi Qur'ani yang Cerdas, Berakhlak Mulia & Mandiri",
    "Cerdas Berilmu, Unggul Berakhlak, Cinta Al-Qur'an",
    "Membimbing Fitrah Anak dengan Al-Qur'an Menuju Generasi Rabbani",
    "Belajar Riang, Hafalan Gemilang, Berakhlakul Karimah"
  ];

  // Handle Image File Upload for School Logo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormFeedback({ type: 'error', text: 'Ukuran file maksimal 5 MB.' });
        return;
      }
      try {
        const compressed = await compressImageFile(file, {
          maxSize: 360,
          quality: 0.8,
          mimeType: file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        });
        setLogoUrl(compressed);
        setFormFeedback(null);
      } catch {
        setFormFeedback({ type: 'error', text: 'Gagal memproses file logo. Silakan coba gambar lain.' });
      }
    }
  };

  // Handle Direct File Upload for Owner Avatar
  const handleOwnerFileUpload = async (file: File) => {
    if (!canEdit || !file) return;
    if (!file.type.startsWith('image/')) {
      setFormFeedback({ type: 'error', text: 'Harap pilih file gambar (JPG, PNG, WebP).' });
      return;
    }
    try {
      const compressed = await compressImageFile(file, { maxSize: 320, quality: 0.78 });
      setOwnerAvatarUrl(compressed);
      setFormFeedback(null);
    } catch {
      setFormFeedback({ type: 'error', text: 'Gagal memproses gambar. Silakan coba gambar lain.' });
    }
  };

  const handleResetToDefaultLogo = () => {
    if (!canEdit) return;
    setLogoUrl(SCHOOL_ASSETS.logo);
  };

  const handleGetCurrentCoordinates = () => {
    if (!canEdit) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setCoordLat(newLat);
          setCoordLng(newLng);
          updateSchoolProfile({
            schoolCoordinates: {
              ...schoolProfile.schoolCoordinates,
              lat: newLat,
              lng: newLng,
              radiusMeters: Number(radiusMeters) || 150,
              name: coordName
            }
          });
          setFormFeedback(null);
          setIsSavedAlert(true);
          setTimeout(() => setIsSavedAlert(false), 3000);
        },
        () => {
          setFormFeedback({
            type: 'error',
            text: 'Tidak dapat mendeteksi lokasi otomatis. Anda dapat mencari nama tempat di peta Google Maps di bawah.'
          });
        }
      );
    }
  };

  const handleSaveCoordinatesOnly = () => {
    if (!canEdit) return;
    if (isNaN(coordLat) || isNaN(coordLng)) {
      setFormFeedback({ type: 'error', text: 'Format koordinat Latitude / Longitude tidak valid.' });
      return;
    }
    updateSchoolProfile({
      schoolCoordinates: {
        lat: Number(coordLat),
        lng: Number(coordLng),
        radiusMeters: Number(radiusMeters) || 150,
        name: coordName.trim() || 'Lokasi Sekolah'
      }
    });
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.7 }
    });
    setFormFeedback(null);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    // Ensure clean npsn without any mention of akreditasi
    const cleanNpsn = npsn.replace(/\|\s*Akreditasi\s*[A-C]/gi, '').trim();

    updateSchoolProfile({
      name,
      motto,
      logoUrl,
      npsn: cleanNpsn,
      address,
      phone,
      email,
      principalName,
      foundationName,
      schoolCoordinates: {
        lat: Number(coordLat) || schoolProfile.schoolCoordinates.lat,
        lng: Number(coordLng) || schoolProfile.schoolCoordinates.lng,
        radiusMeters: Number(radiusMeters) || 150,
        name: coordName.trim() || schoolProfile.schoolCoordinates.name
      }
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    setFormFeedback(null);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  const handleSaveOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!ownerName.trim()) {
      setFormFeedback({ type: 'error', text: 'Nama pemilik akun tidak boleh kosong.' });
      return;
    }

    const cleanUsername = ownerUsername.trim().toLowerCase().replace(/\s+/g, '.');

    updateOwnerUser({
      name: ownerName.trim(),
      username: cleanUsername,
      ...(ownerPassword.trim() ? { password: ownerPassword.trim() } : {}),
      position: ownerPosition.trim(),
      phone: ownerPhone.trim(),
      email: ownerEmail.trim(),
      avatarUrl: ownerAvatarUrl
    });
    setOwnerPassword('');

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    setFormFeedback(null);
    setOwnerSavedAlert(true);
    setTimeout(() => setOwnerSavedAlert(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-700/80 rounded-lg text-amber-300">
              <School className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-300">
              Pengaturan Lembaga & Kepemilikan
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Profil Sekolah & Pengalihan Pemilik Akun
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Sesuaikan logo resmi, motto pendidikan, legalitas, koordinat GPS presensi, serta kelola atau alihkan kepemilikan akun lembaga ke Pemilik Baru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit ? (
            <span className="px-3.5 py-2 rounded-xl bg-amber-400/20 text-amber-200 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Akses Penuh: {isAccountOwner ? '👑 Pemilik Akun' : currentUser.name}</span>
            </span>
          ) : (
            <span className="px-3.5 py-2 rounded-xl bg-white/10 text-emerald-200 border border-white/20 text-xs font-medium flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-300" />
              <span>Hanya Lihat (Khusus Pemilik Akun)</span>
            </span>
          )}
        </div>

        {isSavedAlert && (
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in">
            <Check className="w-4 h-4" /> Profil Sekolah Berhasil Disimpan!
          </div>
        )}

        {ownerSavedAlert && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-slate-950" /> Data Pemilik Baru Berhasil Diperbarui!
          </div>
        )}
      </div>

      {formFeedback && (
        <div
          className={`rounded-2xl px-4 py-3 border flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in ${
            formFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Auto-Save & Live Sync Strip */}
      {canEdit && onOpenPublishModal && (
        <div
          className={`rounded-2xl px-4 py-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            autoSaveStatus === 'offline' || hasPendingChanges
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Rocket className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              {autoSaveStatus === 'saving' ? (
                <>
                  <strong>Sedang menyimpan otomatis ke server...</strong> Setiap perubahan profil, guru, murid, presensi, dan halaqoh langsung tersinkron.
                </>
              ) : autoSaveStatus === 'offline' || hasPendingChanges ? (
                <>
                  <strong>Tersimpan di browser lokal.</strong> Sistem akan menyinkronkan otomatis begitu koneksi ke server kembali stabil.
                </>
              ) : (
                <>
                  <strong>Simpan &amp; Update Otomatis Aktif</strong> ({publishMeta.publishedVersion > 0 ? `Versi Live v${publishMeta.publishedVersion}` : 'Siap'}). Setiap perubahan data langsung tersimpan otomatis ke semua perangkat.
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenPublishModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto shadow-xs"
          >
            <Rocket className="w-3.5 h-3.5 text-amber-300" />
            <span>Riwayat &amp; Backup Data</span>
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('school')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'school'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Profil & Identitas Sekolah</span>
        </button>

        <button
          onClick={() => setActiveTab('owner')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'owner'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-300" />
          <span>Pengalihan / Pemilik Baru (Yayasan)</span>
          <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-amber-100 text-amber-800 font-black">
            Owner
          </span>
        </button>
      </div>

      {/* ======================= TAB 1: SCHOOL IDENTITY ======================= */}
      {activeTab === 'school' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live School Identity Preview Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 text-center flex flex-col items-center relative overflow-hidden">
              <div className="w-full h-24 bg-gradient-to-r from-emerald-800 to-teal-800 absolute top-0 left-0" />

              {/* Logo with live ring */}
              <div className="relative mt-8 mb-3">
                <img
                  src={logoUrl}
                  alt="Logo Sekolah"
                  className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover bg-white p-1 ring-2 ring-emerald-500"
                />
                <div className="absolute bottom-0 right-0 bg-amber-500 text-white p-1 rounded-full shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900 leading-tight">
                {name}
              </h3>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {npsn}
              </span>

              {/* Motto Box */}
              <div className="mt-4 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl w-full text-center">
                <span className="text-[9px] uppercase font-bold text-emerald-800 block mb-0.5">
                  Motto Sekolah:
                </span>
                <p className="text-xs italic font-medium text-slate-700 leading-relaxed">
                  "{motto}"
                </p>
              </div>

              {/* School Details */}
              <div className="mt-4 w-full text-left space-y-2 text-xs border-t border-slate-100 pt-4">
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">{address}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-mono">{phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">{email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">Kepsek: <strong>{principalName}</strong></span>
                </div>
              </div>
            </div>

            {/* Account Owner Mini Card with quick switch to Owner Tab */}
            <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                  <Crown className="w-4 h-4 text-amber-600" />
                  Pemilik Akun Terdaftar
                </span>
                <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-full font-bold text-[10px]">
                  Yayasan
                </span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={currentOwner.avatarUrl}
                  alt={currentOwner.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shadow-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-xs truncate">{currentOwner.name}</div>
                  <div className="text-[10px] text-amber-800 truncate">{currentOwner.position || 'Pemilik Akun & Pembina Yayasan'}</div>
                  <div className="text-[10px] font-mono text-slate-500">@{currentOwner.username}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('owner')}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>{canEdit ? 'Kelola & Alihkan Pemilik Baru' : 'Lihat Info Pemilik Akun'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Info Card */}
            <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Sinkronisasi Sistemik Otomatis
              </span>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                Setiap kali logo atau motto diperbarui di sini, perubahan langsung tercermin pada kop surat laporan PDF harian & bulanan, kuitansi SPP digital, serta kartu santri ber-QR Code.
              </p>
            </div>
          </div>

          {/* Right Column: Edit Profile Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <School className="w-5 h-5 text-emerald-600" />
                  Formulir Edit Logo & Profil Sekolah
                </h3>
                <p className="text-xs text-slate-500">
                  Perbarui data lembaga pendidikan untuk keperluan administrasi dan pencetakan dokumen.
                </p>
              </div>

              {!canEdit && (
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hanya Lihat (Khusus Pemilik Akun)</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* 1. EDIT LOGO SEKOLAH */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 block text-xs">
                      Logo Resmi TK Al Mishbah
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Format PNG/JPG transparan, disarankan rasio 1:1 (persegi).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToDefaultLogo}
                    disabled={!canEdit}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset ke Default
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <div className="relative group shrink-0">
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="w-16 h-16 rounded-2xl border-2 border-emerald-500 shadow-md object-cover bg-white p-1"
                    />
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        disabled={!canEdit}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!canEdit}
                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" /> Upload File Logo (Maks 3MB)
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        disabled={!canEdit}
                        placeholder="Atau tautan langsung: https://..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-mono text-[11px] focus:outline-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. IDENTITAS & MOTTO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Resmi Sekolah</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">NPSN (Nomor Pokok Sekolah Nasional)</label>
                  <input
                    type="text"
                    required
                    value={npsn}
                    onChange={(e) => setNpsn(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Contoh: NPSN: 69982412"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Motto Pendidikan Islami
                </label>
                <input
                  type="text"
                  required
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />

                {/* Preset Suggestions */}
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">Rekomendasi:</span>
                  {presetMottos.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setMotto(preset)}
                      className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] border border-emerald-200 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. KONTAK & LEGALITAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Yayasan Penyelenggara</label>
                  <input
                    type="text"
                    value={foundationName}
                    onChange={(e) => setFoundationName(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Yayasan Pendidikan Islam Al Mishbah"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Kepala Sekolah & Gelar</label>
                  <input
                    type="text"
                    required
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Telepon / WhatsApp Sekolah</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Resmi Sekolah</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Kampus Utama</label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              {/* 4. GPS GEOFENCE CONFIGURATION & GOOGLE MAPS PICKER */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        Titik Koordinat Sekolah & Radius Presensi (Google Maps)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Cari nama tempat di Google Maps, klik peta, atau geser pin untuk mengatur titik pusat geofencing.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetCurrentCoordinates}
                    disabled={!canEdit}
                    className="px-2.5 py-1.5 text-[10px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto shadow-2xs"
                  >
                    <MapPin className="w-3 h-3" /> Ambil GPS Perangkat
                  </button>
                </div>

                {/* Interactive Google Maps Search & Pin Picker */}
                <GoogleMapsCoordinatePicker
                  lat={coordLat}
                  lng={coordLng}
                  radiusMeters={radiusMeters}
                  locationName={coordName}
                  canEdit={canEdit}
                  onCoordinatesChange={(newLat, newLng, newLocationName) => {
                    setCoordLat(Number(newLat.toFixed(6)));
                    setCoordLng(Number(newLng.toFixed(6)));
                    if (newLocationName) {
                      setCoordName(newLocationName);
                    }
                  }}
                  onApplyAddress={(newAddr) => setAddress(newAddr)}
                />

                {/* Editable Coordinate & Radius Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">
                      Radius Aman (Meter)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={10000}
                      value={radiusMeters}
                      onChange={(e) => setRadiusMeters(Number(e.target.value))}
                      disabled={!canEdit}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-emerald-600"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={coordLat}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setCoordLat(val);
                      }}
                      disabled={!canEdit}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-emerald-600"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={coordLng}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setCoordLng(val);
                      }}
                      disabled={!canEdit}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-emerald-600"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">
                      Label Titik Lokasi
                    </label>
                    <input
                      type="text"
                      value={coordName}
                      onChange={(e) => setCoordName(e.target.value)}
                      disabled={!canEdit}
                      placeholder="Gedung Utama Sekolah"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-emerald-200/70">
                    <span className="text-[11px] text-emerald-900">
                      Titik tersimpan saat ini: <strong className="font-mono">{schoolProfile.schoolCoordinates.lat.toFixed(6)}, {schoolProfile.schoolCoordinates.lng.toFixed(6)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveCoordinatesOnly}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Check className="w-3.5 h-3.5" /> Terapkan & Simpan Titik Koordinat
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              {canEdit ? (
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Simpan Perubahan Profil Sekolah
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-2 text-amber-800 font-medium bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Pengeditan dinonaktifkan: Hanya <strong>Pemilik Akun</strong> yang dapat menyimpan perubahan identitas &amp; pengaturan sekolah.</span>
                  </span>
                  <span className="px-4 py-2 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed">
                    Simpan Terkunci
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: OWNER REPLACEMENT (PEMILIK BARU) ======================= */}
      {activeTab === 'owner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Owner Status & Security Badge */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Owner Preview Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-amber-200 text-center flex flex-col items-center relative overflow-hidden">
              <div className="w-full h-24 bg-gradient-to-r from-amber-600 to-amber-700 absolute top-0 left-0" />

              {/* Owner Avatar with Crown badge */}
              <div className="relative mt-8 mb-3">
                <img
                  src={ownerAvatarUrl}
                  alt={ownerName || 'Pemilik Baru'}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover bg-white ring-2 ring-amber-500"
                />
                <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full shadow-md">
                  <Crown className="w-4 h-4" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 mb-2">
                <Crown className="w-3 h-3 text-amber-600" />
                <span>AKUN UTAMA / PEMILIK LEMBAGA</span>
              </div>

              <h3 className="text-base font-black text-slate-900 leading-tight">
                {ownerName || 'Nama Pemilik Baru'}
              </h3>
              <p className="text-xs text-amber-800 font-bold mt-0.5">
                {ownerPosition || 'Ketua Yayasan & Pemilik Akun'}
              </p>
              <div className="text-[11px] font-mono text-slate-500 mt-1">
                Username: @{ownerUsername || 'pemilik.akun'}
              </div>

              {/* Detail list */}
              <div className="mt-4 w-full text-left space-y-2 text-xs border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-mono">{ownerPhone || '0812-xxxx-xxxx'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px]">{ownerEmail || 'yayasan@tk-almishbah.sch.id'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-bold text-emerald-800">Hak Akses: Penuh (Master Admin)</span>
                </div>
              </div>
            </div>

            {/* Authority Guidance */}
            <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <span className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Ketentuan Pengalihan Pemilik Akun
              </span>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Fitur ini disediakan agar yayasan atau pengurus sekolah dapat memperbarui atau menggantikan profil pemilik akun utama bila terjadi pergantian ketua yayasan, pembina, atau pemegang amanah baru.
              </p>
              <ul className="text-[11px] text-amber-900 list-disc list-inside space-y-1 pt-1">
                <li>Username login akan diperbarui secara otomatis.</li>
                <li>Pemilik baru memiliki hak penuh mengelola master data dan profil sekolah.</li>
                <li>Perubahan langsung disimpan ke pangkalan data sistem.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Owner Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-600" />
                  Formulir Penggantian & Pengalihan Pemilik Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Gantikan identitas, kredensial login, dan foto pemilik akun lembaga (Ketua Yayasan / Pembina).
                </p>
              </div>

              {canEdit ? (
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>Otoritas Pemilik Akun</span>
                </span>
              ) : (
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hanya Lihat (Khusus Pemilik Akun)</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveOwner} className="space-y-5 text-xs">
              {/* Photo Upload for Owner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <div className="relative group shrink-0">
                  <img
                    src={ownerAvatarUrl}
                    alt={ownerName || 'Pemilik Baru'}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-xs bg-white"
                  />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setIsPhotoModalOpen(true)}
                      className="absolute -bottom-1 -right-1 p-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                      title="Ubah Foto Pemilik"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0 w-full space-y-1.5">
                  <div className="font-extrabold text-slate-800 text-xs">Foto Profil Pemilik Baru</div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {canEdit
                      ? 'Upload file foto resmi dari perangkat, jepret via webcam, atau pilih avatar'
                      : 'Foto profil Pemilik Akun hanya dapat diubah oleh Pemilik Akun'}
                  </p>
                  {canEdit && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <label className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                        <Upload className="w-3 h-3 text-amber-700" />
                        <span>Pilih File Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleOwnerFileUpload(file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsPhotoModalOpen(true)}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Kamera & Avatar</span>
                      </button>
                    </div>
                  )}
                  <input
                    type="text"
                    value={ownerAvatarUrl}
                    onChange={(e) => setOwnerAvatarUrl(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Atau masukkan URL foto (https://...)"
                    className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-amber-600 font-mono text-slate-600"
                  />
                </div>
              </div>

              {/* Owner Details Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Lengkap Pemilik Baru & Gelar
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Contoh: Drs. H. Abdullah Mansyur, M.M"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-amber-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Jabatan di Yayasan / Lembaga
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerPosition}
                    onChange={(e) => setOwnerPosition(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Contoh: Ketua Yayasan & Pemilik Akun Utama"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-amber-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Username Login Portal (ID Akun)
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Contoh: pemilik.baru"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-amber-600 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Digunakan saat masuk login ke sistem.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp / HP Pemilik Baru
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    disabled={!canEdit}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-amber-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Email Resmi Pemilik / Yayasan
                  </label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    disabled={!canEdit}
                    placeholder="yayasan@tk-almishbah.sch.id"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-amber-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kata Sandi Login Pemilik Baru</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showOwnerPassword ? 'text' : 'password'}
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      disabled={!canEdit}
                      placeholder={canEdit ? 'Kosongkan jika tidak mengubah sandi' : 'Terkunci (Khusus Pemilik Akun)'}
                      className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-amber-600 focus:bg-white"
                    />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setShowOwnerPassword((prev) => !prev)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Extra spacing wrapper closed above */}

              {/* Confirmation Notice */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">
                    Konfirmasi Pengalihan Hak Kepemilikan Akun
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Dengan menekan tombol simpan di bawah, data pemilik akun yayasan akan digantikan dengan data baru ini. Kredensial dan profil pemilik baru akan langsung aktif di seluruh ekosistem aplikasi.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              {canEdit ? (
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Simpan & Alihkan ke Pemilik Baru
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-2 text-amber-800 font-medium bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Pengeditan dinonaktifkan: Hanya <strong>Pemilik Akun</strong> yang dapat mengubah atau mengalihkan kepemilikan akun lembaga.</span>
                  </span>
                  <span className="px-4 py-2 bg-slate-100 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed">
                    Simpan Terkunci
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* PHOTO UPLOAD MODAL FOR OWNER */}
      {isPhotoModalOpen && canEdit && (
        <PhotoUploadModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          currentPhotoUrl={ownerAvatarUrl}
          entityName={ownerName || 'Pemilik Baru'}
          entityType="staff"
          gender="L"
          onSavePhoto={(newPhotoUrl) => {
            setOwnerAvatarUrl(newPhotoUrl);
            setIsPhotoModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
