import type { DownloadedTrack, Track } from '../types';

const DB_NAME = 'wesley-music-db';
const DB_VERSION = 1;
const STORE_NAME = 'downloads';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDownloadedTrack(
  track: Track,
  blob: Blob,
  mimeType: string
): Promise<DownloadedTrack> {
  const db = await openDB();
  const record: DownloadedTrack = {
    ...track,
    source: 'offline',
    blob,
    mimeType: mimeType || blob.type || 'audio/mpeg',
    sizeBytes: blob.size,
    downloadedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllDownloadedTracks(): Promise<DownloadedTrack[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const items = (req.result as DownloadedTrack[]) || [];
      items.sort((a, b) => b.downloadedAt - a.downloadedAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getDownloadedTrackById(id: string): Promise<DownloadedTrack | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result as DownloadedTrack | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDownloadedTrack(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function saveBlobToDeviceMusicFolder(blob: Blob, title: string, artist?: string): void {
  const cleanTitle = (artist ? `${artist} - ${title}` : title)
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .slice(0, 90) || 'wesley-music-track';
  const ext = blob.type.includes('mp4') || blob.type.includes('m4a') ? 'm4a' : 'mp3';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanTitle}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
