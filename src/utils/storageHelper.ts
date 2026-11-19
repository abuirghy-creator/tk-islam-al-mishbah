const MAX_INLINE_IMAGE_CHARS = 50_000;

const SECONDARY_CACHE_KEYS = [
  'tk_mishbah_notifs',
  'tk_mishbah_chats',
  'tk_mishbah_gallery',
  'tk_mishbah_tch_att',
  'tk_mishbah_std_att',
  'tk_mishbah_announcements',
  'tk_mishbah_leaves',
  'tk_mishbah_halaqoh',
  'tk_mishbah_spp'
];

const isQuotaError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; code?: number; message?: string };
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014 ||
    (typeof e.message === 'string' && e.message.toLowerCase().includes('quota'))
  );
};

export const stripOversizedInlineImages = (
  input: unknown,
  maxChars: number = MAX_INLINE_IMAGE_CHARS
): unknown => {
  if (typeof input === 'string') {
    if (input.startsWith('data:image/') && input.length > maxChars) {
      return '';
    }
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => stripOversizedInlineImages(item, maxChars));
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = stripOversizedInlineImages(v, maxChars);
    }
    return out;
  }
  return input;
};

const compactSecondaryStorageKeys = (excludeKey?: string) => {
  for (const key of SECONDARY_CACHE_KEYS) {
    if (key === excludeKey) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      if (raw.length > 150_000) {
        const parsed = JSON.parse(raw);
        let compacted = stripOversizedInlineImages(parsed, 25_000);
        if (Array.isArray(compacted)) {
          const arr: unknown[] = compacted;
          if (key === 'tk_mishbah_notifs') compacted = arr.slice(0, 25);
          else if (key === 'tk_mishbah_chats') compacted = arr.slice(-50);
          else if (key === 'tk_mishbah_tch_att') compacted = arr.slice(0, 40);
        }
        localStorage.setItem(key, JSON.stringify(compacted));
      }
    } catch {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore storage errors during cleanup
      }
    }
  }
};

export const cleanupBloatedLocalStorage = () => {
  try {
    let totalChars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('tk_mishbah_')) {
        totalChars += localStorage.getItem(k)?.length || 0;
      }
    }

    // If total cached data approaches ~2.5MB, strip oversized base64 blobs
    if (totalChars > 1_250_000) {
      compactSecondaryStorageKeys();
      const coreKeys = [
        'tk_mishbah_users',
        'tk_mishbah_current_user',
        'tk_mishbah_teachers',
        'tk_mishbah_students',
        'tk_mishbah_staff',
        'tk_mishbah_school_profile'
      ];
      for (const key of coreKeys) {
        try {
          const raw = localStorage.getItem(key);
          if (raw && raw.length > 250_000) {
            const parsed = JSON.parse(raw);
            const compacted = stripOversizedInlineImages(parsed, MAX_INLINE_IMAGE_CHARS);
            localStorage.setItem(key, JSON.stringify(compacted));
          }
        } catch {
          // ignore per-key failure
        }
      }
    }
  } catch {
    // ignore if storage is inaccessible
  }
};

export const safeJsonParse = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
};

export const safeStorageSetRaw = (key: string, rawValue: string): void => {
  try {
    localStorage.setItem(key, rawValue);
    return;
  } catch (err) {
    if (!isQuotaError(err)) {
      console.warn(`Gagal menyimpan ${key} ke localStorage:`, err);
      return;
    }
  }
  compactSecondaryStorageKeys(key);
  try {
    localStorage.setItem(key, rawValue);
  } catch {
    console.warn(`Penyimpanan lokal penuh untuk ${key}.`);
  }
};

export const safeStorageSet = (key: string, value: unknown): void => {
  const serialize = (val: unknown) => JSON.stringify(val);

  try {
    localStorage.setItem(key, serialize(value));
    return;
  } catch (err) {
    if (!isQuotaError(err)) {
      console.warn(`Gagal menyimpan ${key} ke localStorage:`, err);
      return;
    }
  }

  // First recovery: compact secondary caches and retry
  compactSecondaryStorageKeys(key);
  try {
    localStorage.setItem(key, serialize(value));
    return;
  } catch {
    // Continue to deeper recovery
  }

  // Second recovery: strip oversized inline base64 images from this payload's storage copy
  try {
    const compactedValue =
      Array.isArray(value) && key === 'tk_mishbah_notifs'
        ? stripOversizedInlineImages(value.slice(0, 25), 20_000)
        : Array.isArray(value) && key === 'tk_mishbah_chats'
        ? stripOversizedInlineImages(value.slice(-50), 20_000)
        : stripOversizedInlineImages(value, 25_000);
    localStorage.setItem(key, serialize(compactedValue));
    return;
  } catch {
    // Last resort: drop secondary cache key if it's non-essential so critical keys succeed
    if (SECONDARY_CACHE_KEYS.includes(key)) {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    console.warn(`Penyimpanan lokal penuh untuk ${key}; data tetap aktif di sesi & server.`);
  }
};
