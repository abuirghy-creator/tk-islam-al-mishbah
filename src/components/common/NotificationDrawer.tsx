import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCheck, AlertTriangle, Clock, CheckCircle2, Info, BellRing } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabKey: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, currentUser } = useApp();

  if (!isOpen) return null;

  const relevantNotifs = notifications.filter(
    (n) => n.forRole === 'all' || n.forRole === currentUser.role
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'info':
        return <Clock className="w-5 h-5 text-blue-600 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-purple-600 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Pusat Pemberitahuan</h2>
              <p className="text-xs text-slate-500">Notifikasi keterlambatan & jadwal mengajar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>{relevantNotifs.length} Pemberitahuan</span>
          <button
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
          >
            <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {relevantNotifs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <BellRing className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="text-sm">Belum ada notifikasi baru</p>
            </div>
          ) : (
            relevantNotifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationAsRead(notif.id);
                  if (notif.linkTab) {
                    onNavigateTab(notif.linkTab);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-white border-slate-100 text-slate-600'
                    : 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                }`}
              >
                <div className="flex gap-3 items-start">
                  {getIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4
                        className={`text-xs font-bold leading-tight ${
                          notif.read ? 'text-slate-700' : 'text-slate-900'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    {notif.linkTab && (
                      <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 hover:underline">
                        Lihat Rincian →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info for Teacher Schedule reminder */}
        {currentUser.role === 'guru' && (
          <div className="p-4 bg-emerald-800 text-white border-t border-emerald-700">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold">Jadwal Mengajar Hari Ini:</span>
            </div>
            <p className="text-[11px] text-emerald-100">
              08:15 WIB - Halaqoh Tahfidz Sentra Qurani • 09:30 WIB - Sentra Seni & Motorik
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
