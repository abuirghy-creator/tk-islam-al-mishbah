import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { buildPortalLinks, getShareableBaseUrl } from '../../utils/portalLinks';
import {
  Rocket,
  X,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  Download,
  Upload,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  History,
  Globe,
  Lock,
  Save,
  Smartphone,
  Home,
  ArrowLeft,
  Wifi
} from 'lucide-react';

interface PublishManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishToHome?: () => void;
}

export const PublishManagerModal: React.FC<PublishManagerModalProps> = ({
  isOpen,
  onClose,
  onFinishToHome
}) => {
  const {
    canEditSchoolData,
    hasPendingChanges,
    lastEditedAt,
    localPublishedVersion,
    hasRemoteUpdate,
    publishMeta,
    isPublishing,
    isSyncing,
    serverReachable,
    autoSaveStatus,
    lastAutoSavedAt,
    lastActionLabel,
    realtimeConnected,
    connectedClientsCount,
    lastSyncedEvent,
    publishUpdates,
    saveDraftToServer,
    pullLatestPublished,
    exportBackupJson,
    importBackupJson
  } = useApp();

  const [releaseNote, setReleaseNote] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [justPublishedVersion, setJustPublishedVersion] = useState<number | null>(null);
  const [copiedUrlKey, setCopiedUrlKey] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const portalLinks = buildPortalLinks();
  const currentUrl = getShareableBaseUrl();

  const handleCloseModal = () => {
    setFeedback(null);
    setJustPublishedVersion(null);
    onClose();
  };

  const handleFinishAndGoHome = () => {
    setFeedback(null);
    setJustPublishedVersion(null);
    if (onFinishToHome) {
      onFinishToHome();
    } else {
      onClose();
    }
  };

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' WIB';
    } catch {
      return iso;
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const result = await publishUpdates(releaseNote);
    if (result.success) {
      setReleaseNote('');
      setJustPublishedVersion(result.version ?? publishMeta.publishedVersion + 1);
      setFeedback({ type: 'success', text: result.message });
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 }
      });
    } else {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  const handleSaveDraft = async () => {
    setFeedback(null);
    setSavingDraft(true);
    const result = await saveDraftToServer();
    setSavingDraft(false);
    setFeedback({
      type: result.success ? 'info' : 'error',
      text: result.message
    });
  };

  const handlePull = async () => {
    setFeedback(null);
    const result = await pullLatestPublished();
    setFeedback({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
  };

  const handleCopyUrl = async (urlToCopy: string = currentUrl, key = 'main') => {
    if (!urlToCopy) return;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedUrlKey(key);
      setTimeout(() => setCopiedUrlKey(null), 2000);
    } catch {
      setFeedback({ type: 'info', text: `Salin tautan secara manual: ${urlToCopy}` });
    }
  };

  const handleExport = () => {
    const filename = exportBackupJson();
    setFeedback({
      type: 'success',
      text: `File cadangan "${filename}" berhasil diunduh.`
    });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = importBackupJson(reader.result);
        setFeedback({
          type: res.success ? 'success' : 'error',
          text: res.message
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 border border-amber-300/40 rounded-2xl text-amber-300">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Sinkronisasi Otomatis, Update &amp; Backup Data
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100">
                Setiap presensi guru/staf, absensi murid, nilai halaqoh, dan pengisian data lainnya otomatis tersimpan &amp; diperbarui ke server.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs max-h-[72vh] overflow-y-auto">
          {/* Completed Publish Action Banner */}
          {justPublishedVersion !== null && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg border border-emerald-400/50 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/15 rounded-xl shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-amber-300" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                    Publikasi Selesai • Versi Live v{justPublishedVersion}
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold mt-0.5">
                    Update & Publish Berhasil Diterbitkan!
                  </h3>
                  <p className="text-[11px] sm:text-xs text-emerald-50 mt-1 leading-relaxed">
                    Seluruh perubahan data sekolah kini aktif dan tersinkron di Web, HP Android, maupun Laptop/PC.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Tetap di Halaman Ini
                </button>
                <button
                  type="button"
                  onClick={handleFinishAndGoHome}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Selesai &amp; Kembali ke Tampilan Awal</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback Alert */}
          {feedback && justPublishedVersion === null && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : feedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="font-semibold leading-relaxed">{feedback.text}</span>
            </div>
          )}

          {/* Server Status + Auto-Save Status Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className={`p-4 rounded-2xl border ${
                autoSaveStatus === 'saving'
                  ? 'bg-sky-50 border-sky-300 text-sky-950'
                  : autoSaveStatus === 'offline' || hasPendingChanges
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-75">
                  Penyimpanan Otomatis
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    autoSaveStatus === 'saving'
                      ? 'bg-sky-200 text-sky-900'
                      : autoSaveStatus === 'offline' || hasPendingChanges
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {autoSaveStatus === 'saving'
                    ? 'Menyimpan...'
                    : autoSaveStatus === 'offline' || hasPendingChanges
                    ? 'Menunggu Koneksi'
                    : 'Tersimpan Otomatis'}
                </span>
              </div>
              <div className="font-extrabold text-sm">
                {autoSaveStatus === 'saving'
                  ? 'Sedang Menyimpan Perubahan...'
                  : autoSaveStatus === 'offline' || hasPendingChanges
                  ? 'Tersimpan Aman di Browser Lokal'
                  : 'Semua Data Tersimpan & Sinkron'}
              </div>
              <div className="text-[11px] opacity-80 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {lastAutoSavedAt
                    ? `Auto-save terakhir: ${formatTimestamp(lastAutoSavedAt)}${lastActionLabel ? ` (${lastActionLabel})` : ''}`
                    : lastEditedAt
                    ? `Diedit: ${formatTimestamp(lastEditedAt)}`
                    : `Versi aktif v${localPublishedVersion || 0}`}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 text-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Koneksi Real-Time Portal
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    realtimeConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : serverReachable
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Wifi className="w-3 h-3" />
                  <span>
                    {realtimeConnected
                      ? `Real-Time Push Aktif • ${connectedClientsCount || 1} Perangkat`
                      : serverReachable
                      ? 'Server Online'
                      : 'Offline'}
                  </span>
                </span>
              </div>
              <div className="font-extrabold text-sm text-emerald-900">
                {publishMeta.publishedVersion > 0
                  ? `Versi Live v${publishMeta.publishedVersion}`
                  : 'Siap Sinkronisasi Otomatis'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {lastSyncedEvent
                  ? `Real-time terakhir: ${lastSyncedEvent.actionLabel} oleh ${lastSyncedEvent.savedBy} (${formatTimestamp(lastSyncedEvent.timestamp)})`
                  : publishMeta.lastPublishedAt
                  ? `Terakhir: ${formatTimestamp(publishMeta.lastPublishedAt)} oleh ${publishMeta.publishedBy || 'Admin'}`
                  : 'Setiap input presensi, halaqoh & data lain akan langsung tersinkron otomatis ke semua portal.'}
              </div>
            </div>
          </div>

          {/* Remote Update Notification Banner */}
          {hasRemoteUpdate && (
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-sky-950 text-xs">
                  Pembaruan Live Tersedia (v{publishMeta.publishedVersion})
                </div>
                <p className="text-[11px] text-sky-800 mt-0.5">
                  Server memiliki versi lebih baru ({publishMeta.publishNote || 'Update data terbaru'}).
                </p>
              </div>
              <button
                type="button"
                onClick={handlePull}
                disabled={isSyncing}
                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Tarik Update Terbaru'}</span>
              </button>
            </div>
          )}

          {/* Main Publish Action Form */}
          {canEditSchoolData ? (
            <form onSubmit={handlePublish} className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-700" />
                  <span>Terbitkan Perubahan ke Live Server</span>
                </div>
                <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Target: v{publishMeta.publishedVersion + 1}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Pembaruan / Rilis (Opsional)
                </label>
                <input
                  type="text"
                  value={releaseNote}
                  onChange={(e) => setReleaseNote(e.target.value)}
                  placeholder="Contoh: Update logo sekolah, data santri baru & koordinat GPS"
                  className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl focus:outline-emerald-600 text-slate-800"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft || isPublishing}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{savingDraft ? 'Menyimpan Draft...' : 'Simpan Draft'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePull}
                    disabled={isSyncing || isPublishing}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Tarik dari Server</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-extrabold rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Rocket className={`w-4 h-4 text-amber-300 ${isPublishing ? 'animate-bounce' : ''}`} />
                  <span>{isPublishing ? 'Mempublish...' : 'Update & Publish Sekarang'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Hak Publish Khusus Pimpinan</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hanya <strong>Pemilik Akun</strong> atau <strong>Kepala Sekolah</strong> yang dapat menerbitkan pembaruan. Anda dapat menarik data terbaru kapan saja.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePull}
                disabled={isSyncing}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Data</span>
              </button>
            </div>
          )}

          {/* Shareable Live URL + Cross-device role links */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Link Akses Guru, Karyawan &amp; Orang Tua Murid</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Wajib Login Username &amp; Sandi
              </span>
            </div>
            <div className="space-y-2">
              {portalLinks.map((linkItem) => (
                <div key={linkItem.audience} className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-emerald-900 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg w-fit sm:w-28 shrink-0 text-center">
                    {linkItem.badge}
                  </span>
                  <input
                    type="text"
                    readOnly
                    value={linkItem.url}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(linkItem.url, linkItem.audience)}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-300 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedUrlKey === linkItem.audience ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedUrlKey === linkItem.audience ? 'Disalin' : 'Salin Link'}</span>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Koneksi real-time berjalan langsung antara server dan setiap Link Portal sehingga tetap aktif walaupun{' '}
              <strong>Pemilik Akun sedang tidak mengakses aplikasi</strong>. Pengisian presensi, absensi &amp; mutabaah oleh Guru langsung tersimpan ke server dan tersinkron otomatis ke semua pengguna.
            </p>
          </div>

          {/* JSON Backup & Restore */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-800">Cadangan & Restore Data (.json)</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ekspor seluruh data sekolah untuk arsip offline atau pulihkan dari file backup.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Backup JSON</span>
              </button>
              {canEditSchoolData && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-700" />
                    <span>Restore JSON</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Publish History */}
          <div className="space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Update & Publish</span>
            </div>
            {publishMeta.history.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-slate-500 text-[11px]">
                Belum ada riwayat publikasi. Setiap perubahan data akan otomatis tercatat di sini.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {publishMeta.history.slice(0, 20).map((entry) => (
                  <div
                    key={entry.version}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-mono font-bold text-[10px]">
                          v{entry.version}
                        </span>
                        <span className="font-bold text-slate-800">{entry.note}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {formatTimestamp(entry.publishedAt)} • oleh <strong>{entry.publishedBy}</strong>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shrink-0">
                      {entry.summary.studentsCount} Santri • {entry.summary.teachersCount} Guru • {entry.summary.staffCount} Staf
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleFinishAndGoHome}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-300" />
            <span>Selesai &amp; Kembali ke Tampilan Awal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
