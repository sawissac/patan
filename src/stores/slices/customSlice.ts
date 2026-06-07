import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CustomAsset, SlotName, RecolorRole } from '../../types/studio';
import { sanitizeSvg } from '../../lib/customParts';

interface CustomState {
  assets: CustomAsset[];
}

// Assets are hydrated asynchronously from IndexedDB (see store.ts + lib/persist.ts).
const initialState: CustomState = {
  assets: [],
};

const uid = () =>
  `ca_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const customSlice = createSlice({
  name: 'custom',
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<CustomAsset[]>) {
      state.assets = action.payload;
    },
    addAsset: {
      reducer(state, action: PayloadAction<CustomAsset>) {
        state.assets.push(action.payload);
      },
      prepare(name: string, svg: string, slot: SlotName, recolorMap: Record<string, RecolorRole>) {
        return {
          payload: {
            id: uid(),
            name,
            svg: sanitizeSvg(svg),
            slot,
            recolor: null,
            recolorMap,
          } satisfies CustomAsset,
        };
      },
    },
    removeAsset(state, action: PayloadAction<string>) {
      state.assets = state.assets.filter((x) => x.id !== action.payload);
    },
    updateAsset(
      state,
      action: PayloadAction<{ id: string; name: string; recolorMap: Record<string, RecolorRole> }>,
    ) {
      const asset = state.assets.find((x) => x.id === action.payload.id);
      if (asset) {
        asset.name = action.payload.name;
        asset.recolorMap = action.payload.recolorMap;
        asset.recolor = null; // superseded by the per-color map
      }
    },
  },
});

export const { hydrate, addAsset, removeAsset, updateAsset } = customSlice.actions;

export default customSlice.reducer;
