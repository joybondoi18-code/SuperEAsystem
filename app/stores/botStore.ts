'use client';

import { create } from 'zustand';

interface BotState {
  isConnected: boolean;
  botId: string | null;
  connectBot: (id: string) => void;
  disconnectBot: () => void;
}

export const useBotStore = create<BotState>((set) => ({
  isConnected: false,
  botId: null,
  connectBot: (id) => set({ isConnected: true, botId: id }),
  disconnectBot: () => set({ isConnected: false, botId: null }),
}));