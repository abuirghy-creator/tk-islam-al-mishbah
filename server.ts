import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '.data');
const STORE_FILE = path.join(DATA_DIR, 'app-store.json');
const PORT = Number(process.env.PORT) || 3000;

const DEFAULT_SUPABASE_URL = 'https://chdaohcievegwnwphxtx.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_KcxH1RTyHmSLzbHSKk2cXg_rU6yyXIl';
const SUPABASE_ROW_ID = 'tk_almishbah_main';
const SUPABASE_CHANNEL_NAME = 'tk-almishbah-realtime';
const SERVER_INSTANCE_ID = crypto.randomUUID();

const normalizeSupabaseUrl = (rawUrl?: string): string => {
  const cleaned = (rawUrl || '').trim();
  if (!cleaned) return '';
  return cleaned.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
};

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL);
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY
).trim();

type SupabaseConnectionState =
  | 'connected'
  | 'needs_table_setup'
  | 'rls_blocked'
  | 'disconnected'
  | 'unconfigured';

let supabaseState: SupabaseConnectionState =
  SUPABASE_URL && SUPABASE_KEY ? 'disconnected' : 'unconfigured';
let supabaseLastError: string | null = null;

const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    : null;

interface PublishSummary {
  studentsCount: number;
  teachersCount: number;
  staffCount: number;
  announcementsCount: number;
  galleryCount: number;
}

interface PublishHistoryEntry {
  version: number;
  publishedAt: string;
  publishedBy: string;
  note: string;
  summary: PublishSummary;
}

type AppSnapshot = Record<string, unknown>;

interface PersistedStore {
  storeId: string;
  publishedVersion: number;
  lastPublishedAt: string | null;
  publishedBy: string | null;
  publishNote: string | null;
  draftVersion: number;
  lastDraftSavedAt: string | null;
  draftSavedBy: string | null;
  lastActionLabel: string | null;
  publishedSnapshot: AppSnapshot | null;
  draftSnapshot: AppSnapshot | null;
  history: PublishHistoryEntry[];
}

interface SupabaseStoreRow {
  id: string;
  store_id: string;
  published_version: number;
  last_published_at: string | null;
  published_by: string | null;
  publish_note: string | null;
  draft_version: number;
  last_draft_saved_at: string | null;
  draft_saved_by: string | null;
  last_action_label: string | null;
  published_snapshot: AppSnapshot | null;
  draft_snapshot: AppSnapshot | null;
  history: PublishHistoryEntry[] | null;
  updated_at?: string;
}

interface AuditLogEntry {
  storeId: string;
  version: number;
  actionLabel: string;
  savedBy: string;
  summary: PublishSummary;
  timestamp: string;
}

const createStoreId = () => `store-${crypto.randomUUID()}`;
const PROCESS_FALLBACK_STORE_ID = createStoreId();

const DEFAULT_STORE: PersistedStore = {
  storeId: '',
  publishedVersion: 0,
  lastPublishedAt: null,
  publishedBy: null,
  publishNote: null,
  draftVersion: 0,
  lastDraftSavedAt: null,
  draftSavedBy: null,
  lastActionLabel: null,
  publishedSnapshot: null,
  draftSnapshot: null,
  history: []
};

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const readLocalStore = (): PersistedStore => {
  try {
    ensureDataDir();
    if (!fs.existsSync(STORE_FILE)) {
      return { ...DEFAULT_STORE, storeId: PROCESS_FALLBACK_STORE_ID };
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    return {
      ...DEFAULT_STORE,
      ...parsed,
      storeId: parsed.storeId || PROCESS_FALLBACK_STORE_ID,
      history: Array.isArray(parsed.history) ? parsed.history : []
    };
  } catch (err) {
    console.error('Failed to read local store cache:', err);
    return { ...DEFAULT_STORE, storeId: PROCESS_FALLBACK_STORE_ID };
  }
};

const writeLocalStore = (store: PersistedStore) => {
  ensureDataDir();
  const payload = JSON.stringify({
    ...store,
    storeId: store.storeId || PROCESS_FALLBACK_STORE_ID
  });
  const tempFile = `${STORE_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, payload, 'utf-8');
  fs.renameSync(tempFile, STORE_FILE);
};

const rowToPersistedStore = (row: SupabaseStoreRow): PersistedStore => ({
  storeId: row.store_id || PROCESS_FALLBACK_STORE_ID,
  publishedVersion: Number(row.published_version || 0),
  lastPublishedAt: row.last_published_at || null,
  publishedBy: row.published_by || null,
  publishNote: row.publish_note || null,
  draftVersion: Number(row.draft_version || 0),
  lastDraftSavedAt: row.last_draft_saved_at || null,
  draftSavedBy: row.draft_saved_by || null,
  lastActionLabel: row.last_action_label || null,
  publishedSnapshot: row.published_snapshot || null,
  draftSnapshot: row.draft_snapshot || null,
  history: Array.isArray(row.history) ? row.history : []
});

const classifySupabaseError = (error: { code?: string; message?: string; status?: number }) => {
  const code = String(error?.code || '');
  const msg = String(error?.message || '');
  supabaseLastError = msg || code || 'Unknown Supabase error';
  if (code === 'PGRST205' || msg.includes('Could not find the table')) {
    supabaseState = 'needs_table_setup';
  } else if (
    code === '42501' ||
    msg.toLowerCase().includes('row-level security') ||
    msg.toLowerCase().includes('permission denied')
  ) {
    supabaseState = 'rls_blocked';
  } else {
    supabaseState = 'disconnected';
  }
};

const upsertSupabaseStore = async (
  store: PersistedStore,
  auditEntry?: AuditLogEntry
): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const nowIso = new Date().toISOString();
    const { error } = await supabase.from('portal_store').upsert(
      {
        id: SUPABASE_ROW_ID,
        store_id: store.storeId || PROCESS_FALLBACK_STORE_ID,
        published_version: store.publishedVersion,
        last_published_at: store.lastPublishedAt,
        published_by: store.publishedBy,
        publish_note: store.publishNote,
        draft_version: store.draftVersion,
        last_draft_saved_at: store.lastDraftSavedAt,
        draft_saved_by: store.draftSavedBy,
        last_action_label: store.lastActionLabel,
        published_snapshot: store.publishedSnapshot,
        draft_snapshot: store.draftSnapshot,
        history: store.history,
        updated_at: nowIso
      },
      { onConflict: 'id' }
    );

    if (error) {
      classifySupabaseError(error);
      return false;
    }

    supabaseState = 'connected';
    supabaseLastError = null;

    if (auditEntry) {
      // Best-effort insert into SQL audit log table (non-blocking)
      void supabase
        .from('portal_updates')
        .insert({
          store_id: auditEntry.storeId,
          version: auditEntry.version,
          action_label: auditEntry.actionLabel,
          saved_by: auditEntry.savedBy,
          summary: auditEntry.summary,
          created_at: auditEntry.timestamp
        })
        .then(({ error: logErr }) => {
          if (logErr && logErr.code !== 'PGRST205') {
            console.warn('Supabase portal_updates audit log warning:', logErr.message);
          }
        });
    }
    return true;
  } catch (err) {
    supabaseState = 'disconnected';
    supabaseLastError = err instanceof Error ? err.message : String(err);
    return false;
  }
};

const readStoreAsync = async (): Promise<PersistedStore> => {
  const localStore = readLocalStore();
  if (!supabase) return localStore;

  try {
    const { data, error } = await supabase
      .from('portal_store')
      .select('*')
      .eq('id', SUPABASE_ROW_ID)
      .maybeSingle<SupabaseStoreRow>();

    if (error) {
      classifySupabaseError(error);
      return localStore;
    }

    supabaseState = 'connected';
    supabaseLastError = null;

    if (data && (data.published_snapshot || data.draft_snapshot || data.published_version > 0)) {
      const remoteStore = rowToPersistedStore(data);
      writeLocalStore(remoteStore);
      return remoteStore;
    }

    // Supabase table exists and is empty: auto-migrate existing local store if populated
    const remoteHasData =
      data && (data.published_snapshot || data.draft_snapshot || Number(data.published_version || 0) > 0);
    if (!remoteHasData && (localStore.publishedSnapshot || localStore.draftSnapshot)) {
      await upsertSupabaseStore(localStore);
    }
    return localStore;
  } catch (err) {
    supabaseState = 'disconnected';
    supabaseLastError = err instanceof Error ? err.message : String(err);
    return localStore;
  }
};

let realtimeChannel: RealtimeChannel | null = null;
let realtimeChannelReady = false;

const publishSupabaseSignal = (store: PersistedStore, auditEntry?: AuditLogEntry) => {
  if (!realtimeChannel || !realtimeChannelReady) return;
  try {
    void realtimeChannel.send({
      type: 'broadcast',
      event: 'store:updated',
      payload: {
        serverInstanceId: SERVER_INSTANCE_ID,
        storeId: store.storeId,
        version: store.publishedVersion,
        actionLabel: auditEntry?.actionLabel || store.lastActionLabel || 'Pembaruan Data',
        savedBy: auditEntry?.savedBy || store.publishedBy || 'Pengguna Sekolah',
        timestamp: auditEntry?.timestamp || store.lastPublishedAt || new Date().toISOString()
      }
    });
  } catch {
    // ignore realtime broadcast send errors
  }
};

const writeStoreAsync = async (store: PersistedStore, auditEntry?: AuditLogEntry) => {
  writeLocalStore(store);
  await upsertSupabaseStore(store, auditEntry);
  publishSupabaseSignal(store, auditEntry);
};

let writeQueue: Promise<unknown> = Promise.resolve();
const enqueueWrite = <T,>(task: () => Promise<T>): Promise<T> => {
  const next = writeQueue.then(task, task);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
};

const buildMeta = (store: PersistedStore, connectedClients = 0) => ({
  storeId: store.storeId,
  publishedVersion: store.publishedVersion,
  lastPublishedAt: store.lastPublishedAt,
  publishedBy: store.publishedBy,
  publishNote: store.publishNote,
  draftVersion: store.draftVersion,
  lastDraftSavedAt: store.lastDraftSavedAt,
  draftSavedBy: store.draftSavedBy,
  lastActionLabel: store.lastActionLabel,
  hasPublishedSnapshot: Boolean(store.publishedSnapshot),
  hasDraftSnapshot: Boolean(store.draftSnapshot),
  connectedClients,
  history: store.history
});

const extractSummary = (snapshot: AppSnapshot): PublishSummary => ({
  studentsCount: Array.isArray(snapshot.students) ? snapshot.students.length : 0,
  teachersCount: Array.isArray(snapshot.teachers) ? snapshot.teachers.length : 0,
  staffCount: Array.isArray(snapshot.staff) ? snapshot.staff.length : 0,
  announcementsCount: Array.isArray(snapshot.announcements) ? snapshot.announcements.length : 0,
  galleryCount: Array.isArray(snapshot.gallery) ? snapshot.gallery.length : 0
});

const mergeCollectionById = (
  key: string,
  existingArr: unknown[],
  incomingArr: unknown[],
  deletedIds: string[] = []
): unknown[] => {
  const deletedSet = new Set(deletedIds.map(String));
  const incomingById = new Map<string, Record<string, unknown>>();
  const incomingOrdered: Record<string, unknown>[] = [];

  for (const item of incomingArr) {
    if (item && typeof item === 'object' && 'id' in item) {
      const rec = item as Record<string, unknown>;
      const idStr = String(rec.id);
      if (!deletedSet.has(idStr) && !incomingById.has(idStr)) {
        incomingById.set(idStr, rec);
        incomingOrdered.push(rec);
      }
    }
  }

  // For chatMessages, preserve chronological append order (oldest -> newest)
  if (key === 'chatMessages') {
    const result: Record<string, unknown>[] = [];
    const seen = new Set<string>();
    for (const item of existingArr) {
      if (item && typeof item === 'object' && 'id' in item) {
        const rec = item as Record<string, unknown>;
        const idStr = String(rec.id);
        if (deletedSet.has(idStr)) continue;
        result.push(incomingById.get(idStr) || rec);
        seen.add(idStr);
      }
    }
    for (const rec of incomingOrdered) {
      const idStr = String(rec.id);
      if (!seen.has(idStr)) {
        result.push(rec);
        seen.add(idStr);
      }
    }
    return result;
  }

  // Keep incoming items in their current order, then retain untouched existing items
  const remainingExisting: Record<string, unknown>[] = [];
  const incomingStudentDateKeys = new Set<string>();
  if (key === 'studentAttendance') {
    for (const rec of incomingOrdered) {
      if (rec.studentId && rec.date) {
        incomingStudentDateKeys.add(`${rec.studentId}__${rec.date}`);
      }
    }
  }

  for (const item of existingArr) {
    if (item && typeof item === 'object' && 'id' in item) {
      const rec = item as Record<string, unknown>;
      const idStr = String(rec.id);
      if (deletedSet.has(idStr) || incomingById.has(idStr)) continue;
      if (
        key === 'studentAttendance' &&
        rec.studentId &&
        rec.date &&
        incomingStudentDateKeys.has(`${rec.studentId}__${rec.date}`)
      ) {
        continue;
      }
      remainingExisting.push(rec);
    }
  }

  const merged = [...incomingOrdered, ...remainingExisting];

  if (key === 'notifications') {
    return merged.slice(0, 80);
  }
  return merged;
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  interface TrackedWs extends WebSocket {
    isAlive?: boolean;
    clientId?: string;
  }

  const sseClients = new Map<Response, string>();

  const getConnectedClientsCount = (): number => {
    const uniqueIds = new Set<string>();
    let anonymousCount = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const tracked = client as TrackedWs;
        if (tracked.clientId) {
          uniqueIds.add(tracked.clientId);
        } else {
          anonymousCount++;
        }
      }
    });
    sseClients.forEach((cid) => {
      if (cid) {
        uniqueIds.add(cid);
      } else {
        anonymousCount++;
      }
    });
    return uniqueIds.size + anonymousCount;
  };

  const broadcastRealtime = (payload: Record<string, unknown>) => {
    const raw = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(raw);
        } catch {
          // ignore broken socket write
        }
      }
    });
    const sseFrame = `data: ${raw}\n\n`;
    sseClients.forEach((_cid, res) => {
      try {
        res.write(sseFrame);
      } catch {
        sseClients.delete(res);
      }
    });
  };

  let lastKnownRemoteSignature = '';
  let remoteSyncInFlight = false;
  let remoteSyncQueued = false;

  const syncFromSupabaseRemoteEvent = async (hint?: {
    actionLabel?: string;
    savedBy?: string;
    timestamp?: string;
  }) => {
    if (remoteSyncInFlight) {
      remoteSyncQueued = true;
      return;
    }
    remoteSyncInFlight = true;
    try {
      const store = await readStoreAsync();
      const sig = `${store.storeId}:${store.publishedVersion}:${store.lastPublishedAt || ''}`;
      if (sig === lastKnownRemoteSignature || !store.publishedSnapshot) {
        return;
      }
      lastKnownRemoteSignature = sig;
      const connectedClients = getConnectedClientsCount();
      const meta = buildMeta(store, connectedClients);
      broadcastRealtime({
        type: 'snapshot:updated',
        meta,
        snapshot: store.publishedSnapshot,
        sourceClientId: null,
        actionLabel: hint?.actionLabel || store.lastActionLabel || 'Pembaruan Cloud Supabase',
        savedBy: hint?.savedBy || store.publishedBy || 'Pengguna Sekolah',
        timestamp: hint?.timestamp || store.lastPublishedAt || new Date().toISOString(),
        connectedClients
      });
    } finally {
      remoteSyncInFlight = false;
      if (remoteSyncQueued) {
        remoteSyncQueued = false;
        void syncFromSupabaseRemoteEvent();
      }
    }
  };

  // Subscribe to Supabase Realtime for cross-container sync (ais-dev <-> ais-pre)
  if (supabase) {
    realtimeChannel = supabase
      .channel(SUPABASE_CHANNEL_NAME)
      .on('broadcast', { event: 'store:updated' }, ({ payload }) => {
        const data = (payload || {}) as {
          serverInstanceId?: string;
          actionLabel?: string;
          savedBy?: string;
          timestamp?: string;
        };
        if (data.serverInstanceId === SERVER_INSTANCE_ID) return;
        void syncFromSupabaseRemoteEvent(data);
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_store',
          filter: `id=eq.${SUPABASE_ROW_ID}`
        },
        (changePayload) => {
          const row = changePayload.new as Partial<SupabaseStoreRow> | undefined;
          if (!row) {
            void syncFromSupabaseRemoteEvent();
            return;
          }
          const sig = `${row.store_id || ''}:${row.published_version || 0}:${row.last_published_at || ''}`;
          if (sig === lastKnownRemoteSignature) return;
          void syncFromSupabaseRemoteEvent({
            actionLabel: row.last_action_label || undefined,
            savedBy: row.published_by || undefined,
            timestamp: row.last_published_at || undefined
          });
        }
      )
      .subscribe((status) => {
        realtimeChannelReady = status === 'SUBSCRIBED';
      });
  }

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const urlObj = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (urlObj.pathname === '/ws/realtime') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', async (ws: TrackedWs, req) => {
    let clientId = '';
    try {
      const urlObj = new URL(req.url || '/', `http://${requestHost(req)}`);
      clientId = urlObj.searchParams.get('clientId') || '';
    } catch {
      clientId = '';
    }
    ws.isAlive = true;
    ws.clientId = clientId || `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    const store = await readStoreAsync();
    lastKnownRemoteSignature = `${store.storeId}:${store.publishedVersion}:${store.lastPublishedAt || ''}`;
    const count = getConnectedClientsCount();
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'realtime:init',
            meta: buildMeta(store, count),
            snapshot: store.publishedSnapshot,
            connectedClients: count
          })
        );
      }
    } catch {
      // ignore send error on closing socket
    }

    broadcastRealtime({
      type: 'presence:update',
      connectedClients: count
    });

    ws.on('message', async (rawMsg) => {
      try {
        const parsed = JSON.parse(String(rawMsg)) as { type?: string; ts?: number };
        ws.isAlive = true;
        if (parsed?.type === 'ping') {
          const latestStore = await readStoreAsync();
          const currentCount = getConnectedClientsCount();
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'pong',
                ts: parsed.ts || Date.now(),
                connectedClients: currentCount,
                publishedVersion: latestStore.publishedVersion,
                hasPublishedSnapshot: Boolean(latestStore.publishedSnapshot)
              })
            );
          }
          return;
        }
        if (parsed?.type === 'sync:request' || parsed?.type === 'state:request') {
          const latestStore = await readStoreAsync();
          const currentCount = getConnectedClientsCount();
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'realtime:init',
                meta: buildMeta(latestStore, currentCount),
                snapshot: latestStore.publishedSnapshot,
                connectedClients: currentCount
              })
            );
          }
        }
      } catch {
        // ignore malformed message
      }
    });

    ws.on('close', () => {
      broadcastRealtime({
        type: 'presence:update',
        connectedClients: getConnectedClientsCount()
      });
    });
  });

  function requestHost(req: http.IncomingMessage) {
    return `http://${req.headers.host || 'localhost'}`;
  }

  const wsHeartbeat = setInterval(() => {
    wss.clients.forEach((client) => {
      const tracked = client as TrackedWs;
      if (tracked.isAlive === false) {
        tracked.terminate();
        return;
      }
      tracked.isAlive = false;
      try {
        tracked.ping();
      } catch {
        // ignore
      }
    });
  }, 20_000);
  wsHeartbeat.unref?.();

  app.use(express.json({ limit: '25mb' }));

  app.use('/api', (_req: Request, res: Response, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  app.get('/api/health', async (_req: Request, res: Response) => {
    await readStoreAsync();
    res.json({
      ok: true,
      status: 'ready',
      realtime: 'websocket+sse+supabase',
      storage: supabaseState === 'connected' ? 'supabase+local-cache' : 'local-cache',
      supabaseStatus: supabaseState,
      supabaseProjectUrl: SUPABASE_URL || null,
      ...(supabaseLastError && supabaseState !== 'connected' ? { supabaseHint: supabaseLastError } : {}),
      connectedClients: getConnectedClientsCount(),
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/realtime/events', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const cid =
      typeof req.query.clientId === 'string' && req.query.clientId
        ? req.query.clientId
        : `sse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    sseClients.set(res, cid);

    const store = await readStoreAsync();
    const count = getConnectedClientsCount();
    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          type: 'realtime:init',
          meta: buildMeta(store, count),
          snapshot: store.publishedSnapshot,
          connectedClients: count
        })}\n\n`
      );
    }

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 15_000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
      broadcastRealtime({
        type: 'presence:update',
        connectedClients: getConnectedClientsCount()
      });
    });
  });

  app.get('/api/publish/status', async (_req: Request, res: Response) => {
    const store = await readStoreAsync();
    res.json({
      success: true,
      meta: buildMeta(store, getConnectedClientsCount())
    });
  });

  app.get('/api/publish/snapshot', async (_req: Request, res: Response) => {
    const store = await readStoreAsync();
    res.json({
      success: true,
      meta: buildMeta(store, getConnectedClientsCount()),
      snapshot: store.publishedSnapshot
    });
  });

  // Idempotent server bootstrap: seeds initial portal data if server & Supabase stores are empty,
  // even when Pemilik Akun is offline/not accessing the app. Never overwrites existing data.
  app.post('/api/bootstrap', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      snapshot?: AppSnapshot;
      savedBy?: string;
      clientId?: string;
    };

    const result = await enqueueWrite(async () => {
      const store = await readStoreAsync();
      const connectedClients = getConnectedClientsCount();

      if (store.publishedSnapshot || store.draftSnapshot) {
        const existingSnapshot = store.publishedSnapshot || store.draftSnapshot;
        return {
          status: 200,
          payload: {
            success: true,
            bootstrapped: false,
            meta: buildMeta(store, connectedClients),
            snapshot: existingSnapshot
          }
        };
      }

      if (!body.snapshot || typeof body.snapshot !== 'object') {
        return {
          status: 400,
          payload: {
            success: false,
            message: 'Snapshot awal tidak valid untuk inisialisasi server.'
          }
        };
      }

      const now = new Date().toISOString();
      const author = (body.savedBy || 'Inisialisasi Portal Otomatis').trim();
      const actionLabel = 'Inisialisasi Otomatis Server Portal';
      const nextVersion = Math.max(1, store.publishedVersion + 1);
      const summary = extractSummary(body.snapshot);

      const historyEntry: PublishHistoryEntry = {
        version: nextVersion,
        publishedAt: now,
        publishedBy: author,
        note: actionLabel,
        summary
      };

      const updatedStore: PersistedStore = {
        ...store,
        publishedVersion: nextVersion,
        lastPublishedAt: now,
        publishedBy: author,
        publishNote: actionLabel,
        draftVersion: Math.max(store.draftVersion + 1, nextVersion),
        lastDraftSavedAt: now,
        draftSavedBy: author,
        lastActionLabel: actionLabel,
        publishedSnapshot: body.snapshot,
        draftSnapshot: body.snapshot,
        history: [historyEntry, ...store.history].slice(0, 50)
      };

      lastKnownRemoteSignature = `${updatedStore.storeId}:${updatedStore.publishedVersion}:${now}`;
      await writeStoreAsync(updatedStore, {
        storeId: updatedStore.storeId,
        version: nextVersion,
        actionLabel,
        savedBy: author,
        summary,
        timestamp: now
      });

      const meta = buildMeta(updatedStore, connectedClients);

      broadcastRealtime({
        type: 'snapshot:updated',
        meta,
        snapshot: body.snapshot,
        sourceClientId: body.clientId || req.header('x-client-id') || null,
        actionLabel,
        savedBy: author,
        timestamp: now,
        connectedClients
      });

      return {
        status: 200,
        payload: {
          success: true,
          bootstrapped: true,
          meta,
          snapshot: body.snapshot
        }
      };
    });

    res.status(result.status).json(result.payload);
  });

  app.post('/api/autosave', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      patch?: AppSnapshot;
      fullSnapshot?: AppSnapshot;
      savedBy?: string;
      actionLabel?: string;
      deletedIdsByKey?: Record<string, string[]>;
      replaceKeys?: string[];
      clientId?: string;
    };

    const hasPatch = body.patch && typeof body.patch === 'object';
    const hasFull = body.fullSnapshot && typeof body.fullSnapshot === 'object';
    if (!hasPatch && !hasFull) {
      res.status(400).json({
        success: false,
        message: 'Payload pembaruan otomatis tidak valid.'
      });
      return;
    }

    const result = await enqueueWrite(async () => {
      const store = await readStoreAsync();
      const existingServerSnapshot = store.publishedSnapshot || store.draftSnapshot;
      if (!existingServerSnapshot && !hasFull) {
        return {
          status: 409,
          payload: {
            success: false,
            needsFullSnapshot: true,
            message: 'Server memerlukan snapshot lengkap untuk menyinkronkan perubahan.'
          }
        };
      }

      const baseSnapshot: AppSnapshot = {
        ...(existingServerSnapshot || body.fullSnapshot || {})
      };
      const replaceSet = new Set(Array.isArray(body.replaceKeys) ? body.replaceKeys : []);
      const deletedMap = body.deletedIdsByKey || {};
      const patchSource = (hasPatch ? body.patch : body.fullSnapshot) || {};

      const nextSnapshot: AppSnapshot = { ...baseSnapshot };
      for (const [key, incomingVal] of Object.entries(patchSource)) {
        if (incomingVal === undefined) continue;
        if (Array.isArray(incomingVal) && Array.isArray(baseSnapshot[key]) && !replaceSet.has(key)) {
          nextSnapshot[key] = mergeCollectionById(
            key,
            baseSnapshot[key] as unknown[],
            incomingVal,
            Array.isArray(deletedMap[key]) ? deletedMap[key] : []
          );
        } else {
          nextSnapshot[key] = incomingVal;
        }
      }

      // Also prune any deletedIds even if patch omitted an array
      for (const [delKey, delIds] of Object.entries(deletedMap)) {
        if (Array.isArray(nextSnapshot[delKey]) && Array.isArray(delIds) && delIds.length > 0) {
          const delSet = new Set(delIds.map(String));
          nextSnapshot[delKey] = (nextSnapshot[delKey] as unknown[]).filter(
            (item) =>
              !(
                item &&
                typeof item === 'object' &&
                'id' in item &&
                delSet.has(String((item as { id: unknown }).id))
              )
          );
        }
      }

      const now = new Date().toISOString();
      const nextVersion = store.publishedVersion + 1;
      const author = (body.savedBy || 'Pengguna').trim();
      const actionLabel = (body.actionLabel || 'Simpan & Update Otomatis').trim();
      const summary = extractSummary(nextSnapshot);

      const historyEntry: PublishHistoryEntry = {
        version: nextVersion,
        publishedAt: now,
        publishedBy: author,
        note: actionLabel,
        summary
      };

      // Only deduplicate identical rapid double-submits within 3 seconds; record all distinct updates
      const existingHistory = [...store.history];
      const latestHistory = existingHistory[0];
      const isDuplicateBurst =
        latestHistory &&
        latestHistory.publishedBy === author &&
        latestHistory.note === actionLabel &&
        Math.abs(new Date(now).getTime() - new Date(latestHistory.publishedAt).getTime()) < 3_000;

      const nextHistory = isDuplicateBurst
        ? [historyEntry, ...existingHistory.slice(1)].slice(0, 50)
        : [historyEntry, ...existingHistory].slice(0, 50);

      const updatedStore: PersistedStore = {
        ...store,
        publishedVersion: nextVersion,
        lastPublishedAt: now,
        publishedBy: author,
        publishNote: actionLabel,
        draftVersion: Math.max(store.draftVersion + 1, nextVersion),
        lastDraftSavedAt: now,
        draftSavedBy: author,
        lastActionLabel: actionLabel,
        publishedSnapshot: nextSnapshot,
        draftSnapshot: nextSnapshot,
        history: nextHistory
      };

      lastKnownRemoteSignature = `${updatedStore.storeId}:${updatedStore.publishedVersion}:${now}`;
      await writeStoreAsync(updatedStore, {
        storeId: updatedStore.storeId,
        version: nextVersion,
        actionLabel,
        savedBy: author,
        summary,
        timestamp: now
      });

      const connectedClients = getConnectedClientsCount();
      const meta = buildMeta(updatedStore, connectedClients);

      broadcastRealtime({
        type: 'snapshot:updated',
        meta,
        snapshot: nextSnapshot,
        sourceClientId: body.clientId || req.header('x-client-id') || null,
        actionLabel,
        savedBy: author,
        timestamp: now,
        connectedClients
      });

      return {
        status: 200,
        payload: {
          success: true,
          message: `Tersimpan & diperbarui otomatis (v${nextVersion}).`,
          meta,
          snapshot: nextSnapshot
        }
      };
    });

    res.status(result.status).json(result.payload);
  });

  app.post('/api/draft/save', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      snapshot?: AppSnapshot;
      savedBy?: string;
    };

    if (!body.snapshot || typeof body.snapshot !== 'object') {
      res.status(400).json({
        success: false,
        message: 'Payload snapshot data tidak valid.'
      });
      return;
    }

    const updatedStore = await enqueueWrite(async () => {
      const store = await readStoreAsync();
      const now = new Date().toISOString();
      const nextStore: PersistedStore = {
        ...store,
        draftVersion: store.draftVersion + 1,
        lastDraftSavedAt: now,
        draftSavedBy: body.savedBy || 'Pengelola',
        draftSnapshot: body.snapshot!
      };
      await writeStoreAsync(nextStore);
      return nextStore;
    });

    res.json({
      success: true,
      message: 'Draft perubahan berhasil disimpan ke server.',
      meta: buildMeta(updatedStore, getConnectedClientsCount())
    });
  });

  app.post('/api/publish', async (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      snapshot?: AppSnapshot;
      publishedBy?: string;
      note?: string;
      clientId?: string;
    };

    const result = await enqueueWrite(async () => {
      const store = await readStoreAsync();
      const targetSnapshot =
        body.snapshot && typeof body.snapshot === 'object'
          ? body.snapshot
          : store.draftSnapshot;

      if (!targetSnapshot) {
        return {
          status: 400,
          payload: {
            success: false,
            message: 'Tidak ada data perubahan yang dapat dipublish.'
          }
        };
      }

      const now = new Date().toISOString();
      const nextVersion = store.publishedVersion + 1;
      const author = (body.publishedBy || 'Pemilik Akun').trim();
      const note = (body.note || `Publikasi pembaruan sistem v${nextVersion}`).trim();
      const summary = extractSummary(targetSnapshot);

      const historyEntry: PublishHistoryEntry = {
        version: nextVersion,
        publishedAt: now,
        publishedBy: author,
        note,
        summary
      };

      const updatedStore: PersistedStore = {
        ...store,
        publishedVersion: nextVersion,
        lastPublishedAt: now,
        publishedBy: author,
        publishNote: note,
        draftVersion: Math.max(store.draftVersion + 1, nextVersion),
        lastDraftSavedAt: now,
        draftSavedBy: author,
        lastActionLabel: note,
        publishedSnapshot: targetSnapshot,
        draftSnapshot: targetSnapshot,
        history: [historyEntry, ...store.history].slice(0, 50)
      };

      lastKnownRemoteSignature = `${updatedStore.storeId}:${updatedStore.publishedVersion}:${now}`;
      await writeStoreAsync(updatedStore, {
        storeId: updatedStore.storeId,
        version: nextVersion,
        actionLabel: note,
        savedBy: author,
        summary,
        timestamp: now
      });

      const connectedClients = getConnectedClientsCount();
      const meta = buildMeta(updatedStore, connectedClients);

      broadcastRealtime({
        type: 'snapshot:updated',
        meta,
        snapshot: targetSnapshot,
        sourceClientId: body.clientId || req.header('x-client-id') || null,
        actionLabel: note,
        savedBy: author,
        timestamp: now,
        connectedClients
      });

      return {
        status: 200,
        payload: {
          success: true,
          message: `Aplikasi berhasil di-update & di-publish (Versi v${nextVersion}).`,
          meta
        }
      };
    });

    res.status(result.status).json(result.payload);
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint API tidak ditemukan.'
    });
  });

  app.use(
    (
      err: Error & { status?: number; type?: string },
      _req: Request,
      res: Response,
      _next: express.NextFunction
    ) => {
      console.warn('Express middleware warning:', err.message || err);
      const statusCode = err.status || (err.type === 'entity.too.large' ? 413 : 500);
      res.status(statusCode).json({
        success: false,
        message:
          err.type === 'entity.too.large'
            ? 'Ukuran data melebihi batas unggahan server. Silakan perkecil ukuran gambar.'
            : err.message || 'Terjadi kesalahan pada server.'
      });
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Initial sync/seed check with Supabase and local cache on startup
  await readStoreAsync();
  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8')) as Partial<PersistedStore>;
      if (!raw.storeId) {
        writeLocalStore({ ...DEFAULT_STORE, ...raw, storeId: PROCESS_FALLBACK_STORE_ID });
      }
    } catch {
      // ignore read errors on startup check
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `TK Al Mishbah server running on http://0.0.0.0:${PORT} (Supabase: ${supabaseState})`
    );
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
