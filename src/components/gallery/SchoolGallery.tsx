import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GalleryItem, Announcement } from '../../types';
import {
  Image,
  Video,
  Bell,
  Play,
  Calendar,
  X,
  Plus,
  Sparkles,
  Tag,
  Check
} from 'lucide-react';

export const SchoolGallery: React.FC = () => {
  const { gallery, announcements, currentUser, addAnnouncement, canEditSchoolData } = useApp();

  const [activeTab, setActiveTab] = useState<'gallery' | 'announcements'>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeMediaModal, setActiveMediaModal] = useState<GalleryItem | null>(null);

  // New announcement modal
  const [isAddAnnModalOpen, setIsAddAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState<Announcement['category']>('Kegiatan');
  const [annContent, setAnnContent] = useState('');

  const categories = ['all', 'Manasik Haji', 'Tahfidz', 'Kreativitas & Seni', 'Pentas Siswa'];

  const filteredGallery = gallery.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSchoolData) return;
    if (!annTitle.trim() || !annContent.trim()) return;

    addAnnouncement({
      title: annTitle,
      category: annCategory,
      author: currentUser.name,
      content: annContent,
      badgeColor:
        annCategory === 'Penting'
          ? 'bg-rose-100 text-rose-800'
          : annCategory === 'SPP & Keuangan'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-emerald-100 text-emerald-800'
    });

    setAnnTitle('');
    setAnnContent('');
    setIsAddAnnModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-700/80 rounded-lg text-amber-300">
              <Image className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-amber-300">
              Dokumentasi & Media Sekolah
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Galeri Kegiatan Santri & Papan Pengumuman
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1">
            Kumpulan dokumentasi foto, video manasik haji, sentra tahfidz, serta maklumat resmi dari manajemen TK Islam Al Mishbah.
          </p>
        </div>

        {/* Tab switch */}
        <div className="bg-black/20 p-1.5 rounded-2xl flex items-center gap-1">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4" /> Galeri Foto & Video
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'announcements'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" /> Papan Pengumuman
          </button>
        </div>
      </div>

      {/* TAB 1: GALERI FOTO & VIDEO */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {/* Category filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'all' ? 'Semua Dokumentasi' : cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveMediaModal(item)}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
              >
                {/* Media Thumbnail */}
                <div className="relative aspect-16/10 bg-slate-900 overflow-hidden">
                  {item.type === 'video' ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-slate-800">
                      <video
                        src={item.mediaUrl}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                        {item.videoDuration || '02:00'}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  <span className="absolute top-3 left-3 bg-emerald-900/80 backdrop-blur-md text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    {item.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium mb-1">
                      {item.date}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                    <span>{item.type === 'video' ? 'Putar Video' : 'Lihat Foto Penuh'}</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PAPAN PENGUMUMAN RESMI */}
      {activeTab === 'announcements' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Maklumat & Pengumuman Resmi TK Al Mishbah
              </h3>
              <p className="text-xs text-slate-500">
                Pemberitahuan akademik, jadwal kegiatan, dan surat edaran sekolah.
              </p>
            </div>

            {canEditSchoolData && (
              <button
                onClick={() => setIsAddAnnModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Buat Pengumuman Baru
              </button>
            )}
          </div>

          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${ann.badgeColor}`}>
                    {ann.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {ann.date} • Oleh: {ann.author}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {ann.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEDIA PREVIEW MODAL */}
      {activeMediaModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{activeMediaModal.title}</h4>
                <span className="text-[10px] text-slate-500">{activeMediaModal.category} • {activeMediaModal.date}</span>
              </div>
              <button
                onClick={() => setActiveMediaModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black flex items-center justify-center min-h-[300px]">
              {activeMediaModal.type === 'video' ? (
                <video
                  src={activeMediaModal.mediaUrl}
                  controls
                  autoPlay
                  className="max-h-[450px] w-full rounded-xl"
                />
              ) : (
                <img
                  src={activeMediaModal.mediaUrl}
                  alt={activeMediaModal.title}
                  className="max-h-[450px] w-full object-contain rounded-xl"
                />
              )}
            </div>

            <div className="p-5 text-xs text-slate-600 leading-relaxed bg-white">
              {activeMediaModal.description}
            </div>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isAddAnnModalOpen && canEditSchoolData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-700" />
                Buat Pengumuman Baru
              </h3>
              <button
                onClick={() => setIsAddAnnModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Contoh: Jadwal Libur Tarhib Ramadhan 1448 H..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-bold"
                >
                  <option value="Kegiatan">Kegiatan Siswa</option>
                  <option value="Penting">Penting / Darurat</option>
                  <option value="Akademik">Akademik & Kalender</option>
                  <option value="SPP & Keuangan">SPP & Keuangan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Maklumat / Pesan</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Tuliskan detail maklumat resmi dari sekolah..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAnnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Publikasikan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
