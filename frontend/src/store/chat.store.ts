import { create } from 'zustand'
import type { ChatMessage, ChatPath } from '../types'

interface ChatStore {
  sessionId: string | null
  path: ChatPath | null
  messages: ChatMessage[]
  isLoading: boolean
  setSession: (sessionId: string, path: ChatPath) => void
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => string
  replaceLoading: (content: string, modelUsed?: string) => void
  setLoading: (v: boolean) => void
  loadSession: (sessionId: string, path: ChatPath, history: ChatMessage[]) => void
  reset: () => void
}

let msgCounter = 0

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: null,
  path: null,
  messages: [],
  isLoading: false,

  setSession: (sessionId, path) =>
    set({ sessionId, path, messages: [] }),

  addMessage: (msg) => {
    const id = `msg_${++msgCounter}`
    set((s) => ({
      messages: [
        ...s.messages,
        { ...msg, id, timestamp: new Date().toISOString() },
      ],
    }))
    return id
  },

  replaceLoading: (content, modelUsed) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.isLoading ? { ...m, content, isLoading: false, modelUsed } : m
      ),
      isLoading: false,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  loadSession: (sessionId, path, history) =>
    set({ sessionId, path, messages: history, isLoading: false }),

  reset: () =>
    set({ sessionId: null, path: null, messages: [], isLoading: false }),
}))