import React, { useEffect, useId, useRef, useState, useCallback } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
  CameraDevice
} from 'html5-qrcode';
import {
  Camera,
  RefreshCw,
  Flashlight,
  Pause,
  Play,
  SwitchCamera,
  AlertTriangle,
  CheckCircle2,
  ClipboardEdit,
  Smartphone
} from 'lucide-react';

interface AndroidBarcodeCameraProps {
  active: boolean;
  autoConnect?: boolean;
  studentsCount: number;
  onDetected: (code: string) => void;
  onSwitchToManual?: () => void;
}

type CameraStatus = 'idle' | 'connecting' | 'scanning' | 'paused' | 'error';

const SUPPORTED_FORMATS: Html5QrcodeSupportedFormats[] = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF
];

function playBeepSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 250);
  } catch {
    // Ignore autoplay restriction or unsupported AudioContext
  }
}

function getFriendlyCameraError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  const lower = raw.toLowerCase();
  if (lower.includes('notallowed') || lower.includes('permission')) {
    return 'Izin kamera belum diberikan. Ketuk ikon kunci/kamera di address bar browser Android lalu izinkan akses Kamera.';
  }
  if (lower.includes('notfound') || lower.includes('requested device not found') || lower.includes('no cameras')) {
    return 'Kamera tidak ditemukan pada perangkat ini. Anda tetap bisa menggunakan scanner USB fisik atau ketik kode secara manual.';
  }
  if (lower.includes('notreadable') || lower.includes('in use')) {
    return 'Kamera sedang dipakai oleh aplikasi lain. Tutup aplikasi kamera lain lalu tekan Hubungkan Ulang.';
  }
  if (lower.includes('insecure') || lower.includes('https')) {
    return 'Akses kamera memerlukan koneksi aman (HTTPS) pada browser Android.';
  }
  return raw || 'Gagal menghubungkan kamera Android secara otomatis.';
}

export const AndroidBarcodeCamera: React.FC<AndroidBarcodeCameraProps> = ({
  active,
  autoConnect = true,
  studentsCount,
  onDetected,
  onSwitchToManual
}) => {
  const reactId = useId();
  const scannerElementId = `android-barcode-reader-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const transitionLockRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef<boolean>(true);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const lastScanRef = useRef<{ code: string; timestamp: number }>({
    code: '',
    timestamp: 0
  });

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [lastScannedFlash, setLastScannedFlash] = useState<string | null>(null);
  const [reconnectTick, setReconnectTick] = useState<number>(0);

  const enqueueTransition = useCallback((fn: () => Promise<void>) => {
    const next = transitionLockRef.current.then(fn, fn);
    transitionLockRef.current = next.catch(() => {});
    return next;
  }, []);

  const stopCameraInternal = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      const state = scanner.getState();
      if (
        state === Html5QrcodeScannerState.SCANNING ||
        state === Html5QrcodeScannerState.PAUSED
      ) {
        await scanner.stop();
      }
    } catch {
      // Ignore stop errors during cleanup
    }

    try {
      scanner.clear();
    } catch {
      // Ignore clear errors
    }

    if (mountedRef.current) {
      setTorchOn(false);
      setTorchSupported(false);
    }
  }, []);

  const startCameraInternal = useCallback(async () => {
    if (!mountedRef.current) return;

    const container = document.getElementById(scannerElementId);
    if (!container) return;

    await stopCameraInternal();
    if (!mountedRef.current) return;

    setStatus('connecting');
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses kamera WebRTC (pastikan dibuka lewat Chrome Android dengan HTTPS).');
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerElementId, {
          formatsToSupport: SUPPORTED_FORMATS,
          useBarCodeDetectorIfSupported: true,
          verbose: false
        });
      }

      const scanner = scannerRef.current;
      const cameraTarget: string | MediaTrackConstraints = selectedCameraId
        ? selectedCameraId
        : { facingMode };

      const handleSuccess = (decodedText: string) => {
        const cleaned = decodedText.trim();
        if (!cleaned) return;
        const normalized = cleaned.toUpperCase();
        const now = Date.now();

        if (
          lastScanRef.current.code === normalized &&
          now - lastScanRef.current.timestamp < 3000
        ) {
          return;
        }

        lastScanRef.current = { code: normalized, timestamp: now };
        playBeepSound();
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(120);
          }
        } catch {
          // Ignore vibrate errors
        }

        if (mountedRef.current) {
          setLastScannedFlash(normalized);
          window.setTimeout(() => {
            if (mountedRef.current) {
              setLastScannedFlash((prev) => (prev === normalized ? null : prev));
            }
          }, 1800);
        }

        onDetectedRef.current(cleaned);
      };

      const scanConfig = {
        fps: 12,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.max(180, Math.min(viewfinderWidth, viewfinderHeight));
          const boxWidth = Math.min(Math.round(viewfinderWidth * 0.78), Math.max(220, Math.round(minEdge * 0.76)));
          const boxHeight = Math.min(Math.round(viewfinderHeight * 0.68), Math.max(150, Math.round(minEdge * 0.56)));
          return { width: boxWidth, height: boxHeight };
        },
        disableFlip: false
      };

      try {
        await scanner.start(cameraTarget, scanConfig, handleSuccess, () => {});
      } catch (primaryErr) {
        // Fallback if specific cameraId or facingMode fails: enumerate available cameras
        const detected = await Html5Qrcode.getCameras().catch(() => [] as CameraDevice[]);
        if (detected.length > 0) {
          if (mountedRef.current) setCameras(detected);
          const rear =
            detected.find((cam) => /back|rear|belakang|environment/i.test(cam.label)) ||
            detected[detected.length - 1];
          await scanner.start(rear.id, scanConfig, handleSuccess, () => {});
        } else {
          throw primaryErr;
        }
      }

      if (!mountedRef.current) {
        await stopCameraInternal();
        return;
      }

      setStatus('scanning');

      // Populate camera list in background for switching
      Html5Qrcode.getCameras()
        .then((list) => {
          if (mountedRef.current && list.length > 0) {
            setCameras(list);
          }
        })
        .catch(() => {});

      // Inspect torch capability on Android
      try {
        const capabilities = scanner.getRunningTrackCameraCapabilities();
        const torch = capabilities.torchFeature();
        if (mountedRef.current) {
          setTorchSupported(Boolean(torch && torch.isSupported()));
        }
      } catch {
        if (mountedRef.current) {
          setTorchSupported(false);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setStatus('error');
        setErrorMessage(getFriendlyCameraError(err));
      }
    }
  }, [facingMode, scannerElementId, selectedCameraId, stopCameraInternal]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      enqueueTransition(() => stopCameraInternal());
    };
  }, [enqueueTransition, stopCameraInternal]);

  useEffect(() => {
    if (active && autoConnect) {
      enqueueTransition(() => startCameraInternal());
    } else {
      enqueueTransition(async () => {
        await stopCameraInternal();
        if (mountedRef.current) {
          setStatus('idle');
        }
      });
    }
  }, [active, autoConnect, reconnectTick, enqueueTransition, startCameraInternal, stopCameraInternal]);

  const handleTogglePause = () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING) {
        scanner.pause(true);
        setStatus('paused');
      } else if (state === Html5QrcodeScannerState.PAUSED) {
        scanner.resume();
        setStatus('scanning');
      }
    } catch {
      // If pause/resume fails, restart camera cleanly
      setReconnectTick((t) => t + 1);
    }
  };

  const handleToggleTorch = async () => {
    const scanner = scannerRef.current;
    if (!scanner || !torchSupported) return;
    try {
      const torch = scanner.getRunningTrackCameraCapabilities().torchFeature();
      if (torch && torch.isSupported()) {
        const nextVal = !torchOn;
        await torch.apply(nextVal);
        setTorchOn(nextVal);
      }
    } catch {
      // Ignore torch error
    }
  };

  const handleSwitchCamera = () => {
    if (cameras.length > 1) {
      const currentIdx = selectedCameraId
        ? cameras.findIndex((c) => c.id === selectedCameraId)
        : -1;
      const nextCamera = cameras[(currentIdx + 1) % cameras.length];
      setSelectedCameraId(nextCamera.id);
      setFacingMode(/front|depan|user/i.test(nextCamera.label) ? 'user' : 'environment');
    } else {
      setSelectedCameraId(null);
      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    }
  };

  const handleRetryConnect = () => {
    setReconnectTick((t) => t + 1);
  };

  return (
    <div className="space-y-3">
      {/* Live Camera Viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/40 shadow-inner min-h-[260px] sm:min-h-[300px] flex items-center justify-center">
        {/* Video container managed by html5-qrcode */}
        <div
          id={scannerElementId}
          className="w-full h-full min-h-[260px] sm:min-h-[300px] [&_video]:w-full [&_video]:h-full [&_video]:min-h-[260px] sm:[&_video]:min-h-[300px] [&_video]:object-cover"
        />

        {/* Top Status Badges */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
          <div
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border ${
              status === 'scanning'
                ? 'bg-emerald-950/85 text-emerald-200 border-emerald-400/50'
                : status === 'connecting'
                ? 'bg-sky-950/85 text-sky-200 border-sky-400/50'
                : status === 'paused'
                ? 'bg-amber-950/85 text-amber-200 border-amber-400/50'
                : status === 'error'
                ? 'bg-rose-950/85 text-rose-200 border-rose-400/50'
                : 'bg-slate-900/85 text-slate-200 border-slate-600/50'
            }`}
          >
            {status === 'scanning' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
            <Smartphone className="w-3.5 h-3.5" />
            <span>
              {status === 'scanning' &&
                `Kamera Android Aktif (${facingMode === 'environment' ? 'Belakang' : 'Depan'})`}
              {status === 'connecting' && 'Menghubungkan Kamera Android...'}
              {status === 'paused' && 'Pemindaian Dijeda'}
              {status === 'error' && 'Kamera Perlu Izin / Tidak Tersedia'}
              {status === 'idle' && 'Kamera Siap Dihubungkan'}
            </span>
          </div>

          <div className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-950/80 text-emerald-200 border border-emerald-500/40 backdrop-blur-md">
            {studentsCount} Santri Terdaftar
          </div>
        </div>

        {/* Laser & Corner Frame Overlay when scanning */}
        {status === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="relative w-60 sm:w-72 h-40 sm:h-44 rounded-2xl border border-emerald-400/35 bg-emerald-500/5">
              {/* 4 Corner accents */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
              {/* Scan beam */}
              <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse" />
            </div>
          </div>
        )}

        {/* Scanned Flash Pill */}
        {lastScannedFlash && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5 animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>Terbaca: {lastScannedFlash}</span>
            </div>
          </div>
        )}

        {/* Connecting Overlay */}
        {status === 'connecting' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
            <div className="text-sm font-bold text-emerald-100">
              Mengaktifkan Kamera Belakang Android...
            </div>
            <div className="text-[11px] text-slate-300 mt-1 max-w-xs">
              Jika muncul pop-up izin kamera di HP Anda, silakan pilih &quot;Izinkan / Allow&quot;.
            </div>
          </div>
        )}

        {/* Paused Overlay */}
        {status === 'paused' && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-20">
            <Pause className="w-10 h-10 text-amber-300 mb-2" />
            <div className="text-sm font-bold text-amber-100">Kamera Scanner Dijeda</div>
            <button
              type="button"
              onClick={handleTogglePause}
              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> Lanjutkan Scan
            </button>
          </div>
        )}

        {/* Error / Permission Denied Fallback Overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 bg-slate-950/92 flex flex-col items-center justify-center p-5 text-center text-white z-20">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-300" />
            </div>
            <div className="text-sm font-extrabold text-white">Kamera Belum Terhubung</div>
            <p className="text-[11px] text-slate-300 mt-1.5 max-w-sm leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={handleRetryConnect}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" /> Hubungkan Kamera Ulang
              </button>
              {onSwitchToManual && (
                <button
                  type="button"
                  onClick={onSwitchToManual}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <ClipboardEdit className="w-3.5 h-3.5" /> Pakai Absen Manual
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Camera Hardware Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-slate-100 rounded-xl px-3 py-2 border border-slate-800">
        <div className="text-[11px] text-slate-300 flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            Arahkan QR Code / Barcode kartu santri ke kotak hijau di tengah layar.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {torchSupported && status === 'scanning' && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                torchOn
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title="Nyalakan / matikan lampu flash kamera"
            >
              <Flashlight className="w-3.5 h-3.5" />
              <span>{torchOn ? 'Flash ON' : 'Flash'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSwitchCamera}
            disabled={status === 'connecting'}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Ganti kamera belakang / depan"
          >
            <SwitchCamera className="w-3.5 h-3.5 text-sky-400" />
            <span>{facingMode === 'environment' ? 'Kamera Depan' : 'Kamera Belakang'}</span>
          </button>

          {(status === 'scanning' || status === 'paused') && (
            <button
              type="button"
              onClick={handleTogglePause}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {status === 'paused' ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" /> Lanjut
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-300" /> Jeda
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleRetryConnect}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Segarkan koneksi kamera"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'connecting' ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
