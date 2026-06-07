import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Mode, Harmony } from '../../types/studio';

interface StudioState {
  seed: number;        // drives avatar part selection (face, eyes, ...)
  paletteSeed: number; // drives palette colors — independent of parts
  mode: Mode;
  harmony: Harmony;
  locked: boolean;
}

const initialState: StudioState = {
  seed: Math.floor(Math.random() * 999999),
  paletteSeed: Math.floor(Math.random() * 999999),
  mode: 'avatar',
  harmony: 'analogous',
  locked: false,
};

const studioSlice = createSlice({
  name: 'studio',
  initialState,
  reducers: {
    setSeed(state, action: PayloadAction<number>) {
      state.seed = action.payload;
    },
    setMode(state, action: PayloadAction<Mode>) {
      state.mode = action.payload;
    },
    setHarmony(state, action: PayloadAction<Harmony>) {
      state.harmony = action.payload;
    },
    setPaletteSeed(state, action: PayloadAction<number>) {
      state.paletteSeed = action.payload;
    },
    shufflePalette(state) {
      state.paletteSeed = Math.floor(Math.random() * 999999);
    },
    setLocked(state, action: PayloadAction<boolean>) {
      state.locked = action.payload;
    },
    shuffle(state) {
      if (!state.locked) {
        state.seed = Math.floor(Math.random() * 999999);
      }
    },
  },
});

export const { setSeed, setMode, setHarmony, setPaletteSeed, shufflePalette, setLocked, shuffle } = studioSlice.actions;
export default studioSlice.reducer;
