import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  buildPortalLinks,
  buildWhatsAppShareUrl,
  getShareableBaseUrl,
  PortalAudience
} from '../../utils/portalLinks';
import {
  Share2,
  X,
  Copy,
  Check,
  GraduationCap,
  Briefcase,
  Users,
  Globe,
  Lock,
  KeyRound,
  Search,
  MessageCircle,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  Wifi
} from 'lucide-react';
import { User } from '../../types';

interface PortalShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortalShareModal: React.FC<PortalShareModalProps> = ({ isOpen, onClose }) => {
  const {
    users,
    schoolProfile,
    currentUser,
    canEditSchoolData,
    updateUserCredentials,
    realtimeConnected,
    connectedClientsCount,
    publishMeta,
    lastSyncedEvent
  } = useApp();

  const [activeTab, setActiveTab] = useState<'links' | 'accounts'>('links');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'guru' | 'karyawan' | 'ortu'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const portalLinks = useMemo(() => buildPortalLinks(), [isOpen]);
  const shareBaseUrl = getShareableBaseUrl();
  const isPersonnel = currentUser.role !== 'ortu';

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === 'guru' && u.role !== 'guru' && u.role !== 'kepala_sekolah') return false;
      if (roleFilter === 'karyawan' && u.role !== 'pegawai' && u.role !== 'admin') return false;
      if (roleFilter === 'ortu' && u.role !== 'ortu') return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.position && u.position.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    });
  }, [users, roleFilter, searchQuery]);

  if (!isOpen) return null;

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    }
  };

  const getInvitationMessage = (audience: PortalAudience, linkUrl: string) => {
    const targetLabel =
      audience === 'guru'
        ? 'Bapak/Ibu Guru & Pendidik'
        : audience === 'karyawan'
        ? 'Bapak/Ibu Karyawan & Staf'
        : audience === 'ortu'
        ? 'Bapak/Ibu Orang Tua / Wali Murid'
        : 'Seluruh Guru, Karyawan & Wali Murid';

    return (
      `Assalamu'alaikum Wr. Wb.\n` +
      `Berikut tautan resmi Portal Aplikasi *${schoolProfile.name}* untuk ${targetLabel}:\n\n` +
      `🔗 Link Akses: ${linkUrl}\n\n` +
      `🔐 Silakan masuk menggunakan *Username* dan *Kata Sandi (Password)* akun Anda masing-masing.`
    );
  };

  const getPersonalCredentialMessage = (u: User) => {
    const portalSuffix =
      u.role === 'ortu'
        ? '/?portal=ortu'
        : u.role === 'pegawai' || u.role === 'admin'
        ? '/?portal=karyawan'
        : '/?portal=guru';
    const link = `${shareBaseUrl}${portalSuffix}`;
    return (
      `Assalamu'alaikum Wr. Wb. ${u.name},\n` +
      `Berikut link & akun akses Portal *${schoolProfile.name}* Anda:\n\n` +
      `🔗 Link Portal: ${link}\n` +
      `👤 Username: ${u.username}\n` +
      `🔑 Password: ${u.password || 'password123'}\n\n` +
      `Harap masukkan username & kata sandi tersebut saat membuka link, dan segera ganti kata sandi melalui menu profil jika diperlukan.`
    );
  };

  const openEditAccount = (u: User) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditPassword(u.password || 'password123');
    setEditFeedback(null);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const res = updateUserCredentials(editingUser.id, editUsername, editPassword);
    setEditFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
    if (res.success) {
      setTimeout(() => {
        setEditingUser(null);
        setEditFeedback(null);
      }, 900);
    }
  };

  const getIconForAudience = (audience: PortalAudience) => {
    if (audience === 'guru') return <GraduationCap className="w-5 h-5 text-emerald-700" />;
    if (audience === 'karyawan') return <Briefcase className="w-5 h-5 text-sky-700" />;
    if (audience === 'ortu') return <Users className="w-5 h-5 text-amber-700" />;
    return <Globe className="w-5 h-5 text-teal-700" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 border border-amber-300/40 rounded-2xl text-amber-300">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Link Akses Aplikasi Guru, Karyawan &amp; Orang Tua
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100">
                Setiap pengguna yang membuka link tetap wajib masuk menggunakan Username &amp; Kata Sandi terdaftar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Switch Tabs */}
        {isPersonnel && (
          <div className="px-5 sm:px-6 pt-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/70">
            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'links'
                  ? 'border-emerald-700 text-emerald-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="w-4 h-4" /> Link Akses Portal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'accounts'
                  ? 'border-emerald-700 text-emerald-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4" /> Daftar Username &amp; Sandi ({users.length})
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {activeTab === 'links' && (
            <>
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-start justify-between gap-3 text-teal-950">
                <div className="flex items-start gap-2.5">
                  <Wifi className={`w-4 h-4 shrink-0 mt-0.5 ${realtimeConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div className="leading-relaxed text-[11px] sm:text-xs">
                    <strong>Sinkronisasi Server Real-Time 24 Jam:</strong> Semua Link Portal terhubung langsung ke server secara real-time meskipun{' '}
                    <strong>Pemilik Akun sedang tidak membuka aplikasi</strong>. Setiap input absensi &amp; mutabaah oleh <strong>Guru</strong> maupun perubahan dari Pemilik Akun langsung tersimpan ke server dan tampil seketika di semua portal.
                    {lastSyncedEvent ? (
                      <span className="block mt-0.5 text-[10px] text-teal-800 font-semibold">
                        Update terakhir: {lastSyncedEvent.actionLabel} ({lastSyncedEvent.savedBy})
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-white border border-teal-200 text-emerald-800 shrink-0">
                  {realtimeConnected ? 'Live' : 'Auto-Sync'}
                  {publishMeta.publishedVersion > 0 ? ` • v${publishMeta.publishedVersion}` : ''}
                  {connectedClientsCount > 1 ? ` • ${connectedClientsCount} Perangkat` : ''}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-950">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px] sm:text-xs">
                  <strong>Keamanan Login Aktif:</strong> Semua tautan di bawah langsung menuju halaman{' '}
                  <strong>Portal Masuk</strong>. Guru, Karyawan, maupun Orang Tua Murid harus mengisi{' '}
                  <strong>Username / Nama Akun</strong> dan <strong>Kata Sandi</strong> yang tersimpan di sistem sebelum dapat membuka data sekolah.
                </div>
              </div>

              <div className="space-y-3">
                {portalLinks.map((item) => {
                  const inviteMsg = getInvitationMessage(item.audience, item.url);
                  const copyLinkKey = `link-${item.audience}`;
                  const copyMsgKey = `msg-${item.audience}`;

                  return (
                    <div
                      key={item.audience}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-emerald-300 transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            {getIconForAudience(item.audience)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {item.title}
                            </div>
                            <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          {item.badge}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={item.url}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => copyText(item.url, copyLinkKey)}
                            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedKey === copyLinkKey ? (
                              <Check className="w-3.5 h-3.5 text-amber-300" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedKey === copyLinkKey ? 'Link Disalin' : 'Salin Link'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => copyText(inviteMsg, copyMsgKey)}
                            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                            title="Salin teks undangan lengkap beserta link"
                          >
                            {copiedKey === copyMsgKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedKey === copyMsgKey ? 'Undangan Disalin' : 'Salin Undangan'}</span>
                          </button>

                          <a
                            href={buildWhatsAppShareUrl(inviteMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl flex items-center gap-1.5"
                            title="Bagikan via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'accounts' && isPersonnel && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl font-bold text-[11px]">
                  {[
                    { key: 'all', label: `Semua (${users.length})` },
                    {
                      key: 'guru',
                      label: `Guru (${users.filter((u) => u.role === 'guru' || u.role === 'kepala_sekolah').length})`
                    },
                    {
                      key: 'karyawan',
                      label: `Karyawan (${users.filter((u) => u.role === 'pegawai' || u.role === 'admin').length})`
                    },
                    {
                      key: 'ortu',
                      label: `Orang Tua (${users.filter((u) => u.role === 'ortu').length})`
                    }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setRoleFilter(tab.key as typeof roleFilter)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        roleFilter === tab.key
                          ? 'bg-white text-emerald-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama / username..."
                    className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 focus:bg-white w-full sm:w-56"
                  />
                </div>
              </div>

              {editingUser && (
                <form
                  onSubmit={handleSaveCredentials}
                  className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-slate-900">
                      Atur Username &amp; Sandi: {editingUser.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                  {editFeedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-bold ${
                        editFeedback.type === 'success'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {editFeedback.text}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Username</label>
                      <input
                        type="text"
                        required
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Kata Sandi Baru
                      </label>
                      <input
                        type="text"
                        required
                        minLength={4}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Simpan Akun
                    </button>
                  </div>
                </form>
              )}

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Nama &amp; Peran</th>
                        <th className="py-2.5 px-3">Username</th>
                        <th className="py-2.5 px-3">Kata Sandi</th>
                        <th className="py-2.5 px-3 text-right">Bagikan / Atur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u, idx) => {
                        const isVisible = Boolean(visiblePasswords[u.id]);
                        const msg = getPersonalCredentialMessage(u);
                        const copyUserKey = `cred-${u.id}-${idx}`;
                        const canEditThisUser = canEditSchoolData;

                        return (
                          <tr key={`${u.id}-${idx}`} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[10px] text-slate-500">
                                {u.position || u.role}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                              {u.username}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-800">
                                  {isVisible ? u.password || 'password123' : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVisiblePasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                                  }
                                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title={isVisible ? 'Sembunyikan sandi' : 'Lihat sandi'}
                                >
                                  {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => copyText(msg, copyUserKey)}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                                  title="Salin Link + Username + Password untuk dikirim ke pengguna"
                                >
                                  {copiedKey === copyUserKey ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedKey === copyUserKey ? 'Disalin' : 'Salin Akses'}</span>
                                </button>
                                <a
                                  href={buildWhatsAppShareUrl(msg)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold rounded-lg text-[10px] flex items-center gap-1"
                                  title="Kirim Link & Akun via WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                                {canEditThisUser && (
                                  <button
                                    type="button"
                                    onClick={() => openEditAccount(u)}
                                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Setiap penambahan atau perubahan akun, kata sandi, absensi, dan data mutabaah <strong>tersinkronisasi otomatis secara real-time</strong> ke seluruh Link Portal sehingga langsung aktif saat Guru, Karyawan, atau Orang Tua membuka link dari HP mereka.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
