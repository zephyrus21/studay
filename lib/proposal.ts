import type { TodoKind } from '@/lib/data'

// Shared by the server (lib/mochi.ts) and the chat UI; kept tiny so client bundles don't pull in the prompt.
export const TODO_MARK = '\u001ETODO'
export type Proposal = { subtopic_id: string; subtopic_name: string; topic_name: string; kind: TodoKind; due: string; start?: string; end?: string; priority?: 'high' | 'medium' | 'low' }
