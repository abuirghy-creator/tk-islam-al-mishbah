export type PortalAudience = 'all' | 'guru' | 'karyawan' | 'ortu';

export interface PortalLinkConfig {
  audience: PortalAudience;
  title: string;
  subtitle: string;
  badge: string;
  url: string;
  sampleUsernameHint: string;
}

/**
 * Resolves the public shareable origin for external users (Guru, Karyawan, Orang Tua Murid).
 * Converts AI Studio preview origin (ais-dev-*) to the shared public origin (ais-pre-*) automatically.
 */
export const getShareableBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin || '';
  if (origin.includes('://ais-dev-')) {
    return origin.replace('://ais-dev-', '://ais-pre-');
  }
  return origin;
};

export const getPortalAudienceFromUrl = (): PortalAudience => {
  if (typeof window === 'undefined') return 'all';
  try {
    const params = new URLSearchParams(window.location.search);
    const val = (params.get('portal') || '').toLowerCase();
    if (val === 'guru' || val === 'teacher') return 'guru';
    if (val === 'karyawan' || val === 'staf' || val === 'staff' || val === 'pegawai') return 'karyawan';
    if (val === 'ortu' || val === 'wali' || val === 'parent') return 'ortu';
  } catch {
    // ignore malformed URL
  }
  return 'all';
};

export const buildPortalLinks = (): PortalLinkConfig[] => {
  const base = getShareableBaseUrl();
  return [
    {
      audience: 'all',
      title: 'Link Portal Utama (Semua Pengguna)',
      subtitle: 'Satu link resmi untuk Kepala Sekolah, Guru, Karyawan, dan Orang Tua Murid.',
      badge: 'Link Utama',
      url: base ? `${base}/` : '/',
      sampleUsernameHint: 'kepala.sekolah, ustadzah.fatimah, admin.tu, ortu.rayyan'
    },
    {
      audience: 'guru',
      title: 'Link Khusus Guru & Pendidik',
      subtitle: 'Akses presensi selfie, absensi siswa barcode/manual, penilaian halaqoh & rapor.',
      badge: 'Portal Guru',
      url: base ? `${base}/?portal=guru` : '/?portal=guru',
      sampleUsernameHint: 'ustadzah.fatimah, ustadz.ahmad, ustadzah.nurul'
    },
    {
      audience: 'karyawan',
      title: 'Link Khusus Karyawan & Staf TU',
      subtitle: 'Akses presensi harian staf, manajemen data sekolah, SPP, & laporan absensi.',
      badge: 'Portal Karyawan',
      url: base ? `${base}/?portal=karyawan` : '/?portal=karyawan',
      sampleUsernameHint: 'admin.tu, hendra.keuangan, suparman.keamanan'
    },
    {
      audience: 'ortu',
      title: 'Link Khusus Orang Tua / Wali Murid',
      subtitle: 'Pantau kehadiran anak, perkembangan halaqoh tahfidz, SPP & chat langsung dengan guru.',
      badge: 'Portal Orang Tua',
      url: base ? `${base}/?portal=ortu` : '/?portal=ortu',
      sampleUsernameHint: 'ortu.rayyan, ortu.aisyah, ortu.fathir'
    }
  ];
};

export const buildWhatsAppShareUrl = (message: string): string => {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};
