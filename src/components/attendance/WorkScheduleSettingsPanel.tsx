import React, { useState, useEffect } from 'react';
import {
  Clock,
  Save,
  RotateCcw,
  Copy,
  CheckCircle2,
  Lock,
  Users,
  Briefcase,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { WeeklyWorkSchedule, WorkDayKey } from '../../types';
import {
  DEFAULT_GURU_WEEKLY_SCHEDULE,
  DEFAULT_KARYAWAN_WEEKLY_SCHEDULE,
  WORK_DAY_ITEMS,
  formatWorkDuration,
  normalizeWorkSchedule,
  timeStringToMinutes
} from '../../utils/workSchedule';

interface GroupScheduleCardProps {
  group: 'guru' | 'karyawan';
}

const GroupScheduleCard: React.FC<GroupScheduleCardProps> = ({ group }) => {
  const { schoolProfile, updateSchoolProfile, canEditSchoolData } = useApp();
  const canEdit = canEditSchoolData;

  const isGuru = group === 'guru';
  const groupLabel = isGuru ? 'Guru & Pendidik' : 'Karyawan & Staf';
  const defaultWeekly = isGuru
    ? DEFAULT_GURU_WEEKLY_SCHEDULE
    : DEFAULT_KARYAWAN_WEEKLY_SCHEDULE;

  const [weeklyDraft, setWeeklyDraft] = useState<WeeklyWorkSchedule>(() => {
    const normalized = normalizeWorkSchedule(schoolProfile.workSchedule);
    return normalized[group];
  });
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!isDirty) {
      const normalized = normalizeWorkSchedule(schoolProfile.workSchedule);
      setWeeklyDraft(normalized[group]);
    }
  }, [schoolProfile.workSchedule, group, isDirty]);

  const handleDayChange = (
    dayKey: WorkDayKey,
    field: 'checkIn' | 'checkOut' | 'enabled',
    value: string | boolean
  ) => {
    if (!canEdit) return;
    setWeeklyDraft((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
    setIsDirty(true);
    setFeedback(null);
  };

  const applyMondayToThu = () => {
    if (!canEdit) return;
    const monday = weeklyDraft.senin;
    setWeeklyDraft((prev) => ({
      ...prev,
      senin: { ...monday },
      selasa: { ...monday },
      rabu: { ...monday },
      kamis: { ...monday }
    }));
    setIsDirty(true);
    setFeedback({
      type: 'success',
      text: `Jam hari Senin (${monday.checkIn} - ${monday.checkOut} WIB) diterapkan ke Senin–Kamis untuk ${groupLabel}. Klik Simpan untuk menyimpan.`
    });
  };

  const applyMondayToAll = () => {
    if (!canEdit) return;
    const monday = weeklyDraft.senin;
    setWeeklyDraft({
      senin: { ...monday },
      selasa: { ...monday },
      rabu: { ...monday },
      kamis: { ...monday },
      jumat: { ...monday }
    });
    setIsDirty(true);
    setFeedback({
      type: 'success',
      text: `Jam hari Senin (${monday.checkIn} - ${monday.checkOut} WIB) diterapkan ke Senin–Jum'at untuk ${groupLabel}. Klik Simpan untuk menyimpan.`
    });
  };

  const handleResetDefaults = () => {
    if (!canEdit) return;
    setWeeklyDraft({ ...defaultWeekly });
    setIsDirty(true);
    setFeedback({
      type: 'success',
      text: `Jadwal ${groupLabel} dikembalikan ke pengaturan standar (belum disimpan). Klik Simpan untuk menerapkan.`
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    for (const day of WORK_DAY_ITEMS) {
      const item = weeklyDraft[day.key];
      if (item.enabled === false) continue;
      const inMin = timeStringToMinutes(item.checkIn);
      const outMin = timeStringToMinutes(item.checkOut);
      if (inMin === null || outMin === null) {
        setFeedback({
          type: 'error',
          text: `Format jam ${groupLabel} pada hari ${day.label} belum valid.`
        });
        return;
      }
      if (outMin <= inMin) {
        setFeedback({
          type: 'error',
          text: `Jam Keluar (${item.checkOut}) harus lebih lambat daripada Jam Masuk (${item.checkIn}) pada hari ${day.label}.`
        });
        return;
      }
    }

    const currentNormalized = normalizeWorkSchedule(schoolProfile.workSchedule);
    const updatedSchedule = normalizeWorkSchedule({
      ...currentNormalized,
      [group]: weeklyDraft
    });

    updateSchoolProfile({ workSchedule: updatedSchedule });
    setWeeklyDraft(updatedSchedule[group]);
    setIsDirty(false);
    setFeedback({
      type: 'success',
      text: `Jadwal Masuk & Keluar ${groupLabel} (Senin – Jum'at) berhasil disimpan dan disinkronkan secara real-time!`
    });
    confetti({
      particleCount: 40,
      spread: 55,
      origin: { y: 0.7 }
    });
  };

  return (
    <div
      className={`bg-white rounded-3xl p-6 shadow-xs border space-y-5 ${
        isGuru ? 'border-emerald-200' : 'border-sky-200'
      }`}
    >
      {/* Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-2xl text-white shrink-0 ${
              isGuru ? 'bg-emerald-700' : 'bg-sky-700'
            }`}
          >
            {isGuru ? <Users className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <span>
                Jadwal Masuk &amp; Keluar {groupLabel} (Senin – Jum&apos;at)
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isGuru
                ? 'Berlaku khusus untuk seluruh Guru, Wali Kelas, Pembimbing Halaqoh, dan Kepala Sekolah.'
                : 'Berlaku khusus untuk seluruh Karyawan, Staf Tata Usaha, Keuangan, Keamanan, dan Kebersihan.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={applyMondayToThu}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer border transition-colors ${
                  isGuru
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                Samakan Sen–Kam
              </button>
              <button
                type="button"
                onClick={applyMondayToAll}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Samakan Sen–Jum
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Standar
              </button>
            </>
          )}
          {!canEdit && (
            <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Hanya Lihat
            </span>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Form Table Senin - Jum'at */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead
              className={`uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 ${
                isGuru ? 'bg-emerald-50/70 text-emerald-900' : 'bg-sky-50/70 text-sky-900'
              }`}
            >
              <tr>
                <th className="py-3 px-4">Hari Kerja</th>
                <th className="py-3 px-4">Status Hari</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Keluar / Pulang</th>
                <th className="py-3 px-4">Total Jam Kerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {WORK_DAY_ITEMS.map((day) => {
                const item = weeklyDraft[day.key];
                const isActive = item.enabled !== false;
                return (
                  <tr
                    key={day.key}
                    className={`transition-colors ${
                      isActive ? 'hover:bg-slate-50/70' : 'bg-slate-50/80 opacity-75'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-800 flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            day.key === 'jumat'
                              ? 'bg-amber-500'
                              : isGuru
                              ? 'bg-emerald-600'
                              : 'bg-sky-600'
                          }`}
                        />
                        {day.label}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleDayChange(day.key, 'enabled', !isActive)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-colors ${
                          isActive
                            ? isGuru
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        } ${canEdit ? 'cursor-pointer hover:opacity-85' : 'cursor-not-allowed'}`}
                      >
                        {isActive ? 'Hari Kerja Aktif' : 'Libur'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={item.checkIn}
                          disabled={!canEdit || !isActive}
                          onChange={(e) => handleDayChange(day.key, 'checkIn', e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-emerald-600 focus:bg-white disabled:opacity-60"
                        />
                        <span className="text-[11px] text-slate-400 font-mono">WIB</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={item.checkOut}
                          disabled={!canEdit || !isActive}
                          onChange={(e) => handleDayChange(day.key, 'checkOut', e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-emerald-600 focus:bg-white disabled:opacity-60"
                        />
                        <span className="text-[11px] text-slate-400 font-mono">WIB</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {isActive ? formatWorkDuration(item.checkIn, item.checkOut) : 'Libur'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        {canEdit ? (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              {isDirty
                ? `Ada perubahan jadwal ${isGuru ? 'Guru' : 'Karyawan'} yang belum disimpan.`
                : `Jadwal ${isGuru ? 'Guru' : 'Karyawan'} sudah tersinkronisasi dengan server.`}
            </span>
            <button
              type="submit"
              className={`px-6 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                isGuru ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-sky-700 hover:bg-sky-800'
              }`}
            >
              <Save className="w-4 h-4" />
              Simpan Jadwal {isGuru ? 'Guru' : 'Karyawan'}
            </button>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-100 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center gap-2 font-medium">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Hanya <strong>Pemilik Akun</strong> yang berwenang mengubah jadwal masuk dan keluar {groupLabel}.
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

interface WorkScheduleSettingsPanelProps {
  scope?: 'both' | 'guru' | 'karyawan';
  showBannerHeader?: boolean;
}

export const WorkScheduleSettingsPanel: React.FC<WorkScheduleSettingsPanelProps> = ({
  scope = 'both',
  showBannerHeader = false
}) => {
  const isGuruOnly = scope === 'guru';
  const isKaryawanOnly = scope === 'karyawan';

  return (
    <div className="space-y-6">
      {showBannerHeader && (
        <div
          className={`rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
            isKaryawanOnly
              ? 'bg-gradient-to-r from-sky-800 via-cyan-800 to-slate-900'
              : 'bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-amber-400/20 rounded-lg text-amber-300">
                <Clock className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-100">
                {isGuruOnly
                  ? 'Menu Khusus Jadwal Pendidik'
                  : isKaryawanOnly
                  ? 'Menu Khusus Jadwal Tenaga Kependidikan'
                  : 'Pengaturan Jadwal Kerja Terpisah'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold">
              {isGuruOnly
                ? "Jadwal Masuk & Keluar Guru (Senin – Jum'at)"
                : isKaryawanOnly
                ? "Jadwal Masuk & Keluar Karyawan (Senin – Jum'at)"
                : "Jadwal Masuk & Keluar Guru & Karyawan (Senin – Jum'at)"}
            </h2>
            <p className="text-xs sm:text-sm text-white/85 max-w-2xl mt-1">
              {isGuruOnly
                ? "Atur jam masuk tepat waktu dan jam pulang resmi khusus untuk Guru & Pendidik mulai hari Senin sampai Jum'at."
                : isKaryawanOnly
                ? "Atur jam masuk tepat waktu dan jam pulang resmi khusus untuk Karyawan & Staf mulai hari Senin sampai Jum'at."
                : "Jadwal Guru dan Jadwal Karyawan dipisahkan secara mandiri untuk hari Senin sampai Jum'at."}
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/15 text-xs font-bold flex items-center gap-2 shrink-0">
            <CalendarDays className="w-4 h-4 text-amber-300" />
            <span>Hari Kerja: Senin – Jum&apos;at</span>
          </div>
        </div>
      )}

      {(scope === 'both' || scope === 'guru') && <GroupScheduleCard group="guru" />}
      {(scope === 'both' || scope === 'karyawan') && <GroupScheduleCard group="karyawan" />}
    </div>
  );
};
