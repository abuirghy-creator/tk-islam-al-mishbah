import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  RotateCw,
  Sparkles,
  Check,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  User,
  Sliders,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl: string;
  title?: string;
  entityName: string;
  entityType: 'student' | 'teacher' | 'staff' | 'user';
  gender?: 'L' | 'P';
  onSavePhoto: (newPhotoUrl: string) => void;
}

// Built-in Islamic Avatars (SVG Data URLs - 100% offline & instant load)
export const ISLAMIC_AVATARS = [
  {
    id: 'santri-boy-1',
    category: 'student-boy',
    gender: 'L',
    label: 'Santri Peci Hitam',
    type: 'student',
    url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'santri-boy-2',
    category: 'student-boy',
    gender: 'L',
    label: 'Santri Ceria',
    type: 'student',
    url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'santri-boy-3',
    category: 'student-boy',
    gender: 'L',
    label: 'Santri Koko Hijau',
    type: 'student',
    url: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'santri-girl-1',
    category: 'student-girl',
    gender: 'P',
    label: 'Santriwati Kerudung Pink',
    type: 'student',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'santri-girl-2',
    category: 'student-girl',
    gender: 'P',
    label: 'Santriwati Tosca',
    type: 'student',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'santri-girl-3',
    category: 'student-girl',
    gender: 'P',
    label: 'Santriwati Pastel',
    type: 'student',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'teacher-female-1',
    category: 'teacher',
    gender: 'P',
    label: 'Ustadzah Syar\'i Hijau',
    type: 'teacher',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'teacher-female-2',
    category: 'teacher',
    gender: 'P',
    label: 'Ustadzah Muda Ceria',
    type: 'teacher',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'teacher-female-3',
    category: 'teacher',
    gender: 'P',
    label: 'Ustadzah Khidmah',
    type: 'teacher',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'teacher-male-1',
    category: 'teacher',
    gender: 'L',
    label: 'Ustadz Pembina Peci',
    type: 'teacher',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'teacher-male-2',
    category: 'teacher',
    gender: 'L',
    label: 'Ustadz Muda Santun',
    type: 'teacher',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'staff-1',
    category: 'staff',
    gender: 'L',
    label: 'Staf Administrasi',
    type: 'staff',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'staff-2',
    category: 'staff',
    gender: 'P',
    label: 'Staf Tata Usaha',
    type: 'staff',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'
  }
];

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  currentPhotoUrl,
  title,
  entityName,
  entityType,
  gender,
  onSavePhoto
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets' | 'url'>('upload');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(currentPhotoUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileSizeInfo, setFileSizeInfo] = useState<string>('');
  const [rotation, setRotation] = useState<number>(0);
  const [urlInput, setUrlInput] = useState<string>('');

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedPhoto(currentPhotoUrl);
      setRotation(0);
      setCapturedSelfie(null);
      setFileSizeInfo('');
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen, currentPhotoUrl]);

  // Clean camera on unmount or tab switch
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser Anda tidak mendukung akses kamera.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Izin akses kamera ditolak. Silakan izinkan akses kamera di peramban Anda atau gunakan opsi Upload File.'
          : 'Kamera tidak ditemukan atau sedang digunakan oleh aplikasi lain.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture frame from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight) || 400;
    canvas.width = 320;
    canvas.height = 320;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Crop square center
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 320, 320);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedSelfie(dataUrl);
      setSelectedPhoto(dataUrl);
      setFileSizeInfo(`Foto Kamera (${Math.round((dataUrl.length * 3) / 4 / 1024)} KB)`);
    }
  };

  const retakePhoto = () => {
    setCapturedSelfie(null);
    setSelectedPhoto(currentPhotoUrl);
    startCamera();
  };

  // Compress & square crop uploaded image
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (JPG, PNG, WebP).');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 360;
        let width = img.width;
        let height = img.height;

        // Crop center square
        const minDim = Math.min(width, height);
        const sx = (width - minDim) / 2;
        const sy = (height - minDim) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
          setSelectedPhoto(compressedDataUrl);
          setRotation(0);
          const kb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
          setFileSizeInfo(`${file.name} • ${MAX_SIZE}x${MAX_SIZE}px (${kb} KB)`);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        alert('Gagal membaca gambar. Silakan coba file lain.');
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);

    // Apply rotation to canvas data
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(160, 160);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(img, -160, -160, 320, 320);
        const rotatedUrl = canvas.toDataURL('image/jpeg', 0.86);
        setSelectedPhoto(rotatedUrl);
      }
    };
    img.src = selectedPhoto;
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setSelectedPhoto(urlInput.trim());
    setFileSizeInfo('URL Gambar Eksternal');
  };

  const handleSave = () => {
    if (!selectedPhoto) {
      alert('Silakan pilih atau unggah foto terlebih dahulu.');
      return;
    }
    stopCamera();
    onSavePhoto(selectedPhoto);
    onClose();
  };

  if (!isOpen) return null;

  // Filter presets by role / gender preference
  const relevantPresets = ISLAMIC_AVATARS.filter((av) => {
    if (entityType === 'student') return av.type === 'student';
    if (entityType === 'teacher') return av.type === 'teacher';
    if (entityType === 'staff') return av.type === 'staff';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700/80 rounded-xl text-emerald-200">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                {title || `Ubah Foto Profil - ${entityName}`}
              </h3>
              <p className="text-xs text-emerald-200">
                Pilih sumber: Upload File, Jepret Kamera, atau Avatar Islami
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Photo & Live Preview Banner */}
        <div className="px-5 py-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={selectedPhoto}
                alt={entityName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80';
                }}
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-700 text-white p-1 rounded-full shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 line-clamp-1">{entityName}</div>
              <div className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider">
                {entityType === 'student'
                  ? 'Santri TK Islam Al Mishbah'
                  : entityType === 'teacher'
                  ? 'Pendidik / Guru'
                  : 'Tenaga Kependidikan'}
              </div>
              {fileSizeInfo && (
                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{fileSizeInfo}</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRotate}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Putar Foto 90 Derajat"
            >
              <RotateCw className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Putar 90°</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPhoto(currentPhotoUrl);
                setRotation(0);
                setFileSizeInfo('Foto dikembalikan ke semula');
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset ke Foto Asal"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Source Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'camera'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Kamera / Selfie</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'presets'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Pilihan Avatar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'url'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Link URL</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 max-h-[360px] overflow-y-auto">
          {/* TAB 1: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/60'
                }`}
              >
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm mb-1">
                  Pilih atau Tarik File Foto ke Sini
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  Mendukung format JPG, PNG, atau WebP. Foto akan dikompresi otomatis secara proporsional agar hemat penyimpanan.
                </p>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Jelajahi File Gambar</span>
                </span>
              </div>

              {isProcessing && (
                <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-center gap-2 text-xs text-emerald-800 font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Sedang memproses dan mengompresi gambar...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE WEBCAM */}
          {activeTab === 'camera' && (
            <div className="space-y-4 text-center">
              {cameraError ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Akses Kamera Terkendala</span>
                  </div>
                  <p className="text-xs text-amber-700">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors"
                  >
                    Gunakan Upload File Saja
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative mx-auto w-64 h-64 bg-slate-900 rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-md">
                    {capturedSelfie ? (
                      <img
                        src={capturedSelfie}
                        alt="Hasil Jepretan"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
                        {/* Circle overlay guide */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-48 h-48 rounded-full border-2 border-dashed border-emerald-400/80 shadow-2xl"></div>
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    {capturedSelfie
                      ? 'Foto berhasil dijepret! Klik Terapkan Foto atau Ambil Ulang jika kurang sesuai.'
                      : 'Posisikan wajah di tengah lingkaran, lalu klik tombol Jepret Foto.'}
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    {capturedSelfie ? (
                      <button
                        type="button"
                        onClick={retakePhoto}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Ambil Ulang</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={!isCameraActive}
                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-amber-300" />
                        <span>Jepret Foto Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AVATAR PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Pilih Avatar Karakter Islami yang Sesuai:
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {relevantPresets.length} Pilihan
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {relevantPresets.map((av) => {
                  const isSelected = selectedPhoto === av.url;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(av.url);
                        setRotation(0);
                        setFileSizeInfo(`Avatar: ${av.label}`);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={av.url}
                        alt={av.label}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{av.label}</div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          {isSelected ? '✓ Terpilih' : 'Klik gunakan'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {relevantPresets.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  Tidak ada preset khusus untuk kategori ini.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: URL INPUT */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat URL Gambar (HTTP / HTTPS):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://contoh.com/foto-profil.jpg"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Gunakan
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Masukkan tautan URL foto dari penyimpanan cloud atau server sekolah Anda.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              // Set to generic blank avatar
              setSelectedPhoto(
                entityType === 'student'
                  ? 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=300&q=80'
                  : 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80'
              );
              setFileSizeInfo('Foto direset ke default');
            }}
            className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hapus / Reset Foto</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>Terapkan Foto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
