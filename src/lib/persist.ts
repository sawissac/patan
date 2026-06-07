import localforage from 'localforage';
import type { CustomAsset } from '../types/studio';

// IndexedDB-backed store (falls back to WebSQL/localStorage automatically).
const db = localforage.createInstance({
  name: 'patan',
  storeName: 'studio',
  description: 'Patan Studio persisted state',
});

const ASSETS_KEY = 'customAssets';

export async function loadCustomAssets(): Promise<CustomAsset[]> {
  try {
    const data = await db.getItem<CustomAsset[]>(ASSETS_KEY);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveCustomAssets(assets: CustomAsset[]): Promise<void> {
  try {
    await db.setItem(ASSETS_KEY, assets);
  } catch {
    /* storage unavailable — non-fatal */
  }
}
