import { configureStore } from '@reduxjs/toolkit';
import studioReducer from './slices/studioSlice';
import customReducer, { hydrate } from './slices/customSlice';
import { loadCustomAssets, saveCustomAssets } from '../lib/persist';

export const store = configureStore({
  reducer: {
    studio: studioReducer,
    custom: customReducer,
  },
});

// Hydrate imported custom assets from IndexedDB (localforage) on startup.
let lastAssets = store.getState().custom.assets;
loadCustomAssets().then((assets) => {
  if (assets.length) store.dispatch(hydrate(assets));
  lastAssets = store.getState().custom.assets;
});

// Persist on every change to the assets slice.
store.subscribe(() => {
  const assets = store.getState().custom.assets;
  if (assets === lastAssets) return;
  lastAssets = assets;
  saveCustomAssets(assets);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
