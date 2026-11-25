export interface Person {
  id: number;
  name: string;
  phone?: string;
  notes: string;
  active: boolean;
}

export interface Proposal {
  id: number;
  boyId: number;
  girlId: number;
  status: number;
  notes: string;
  endReason: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUSES = [
  { label: 'רעיון חדש', icon: '💡', color: '#8b5cf6' },
  { label: 'דיברתי עם הבחור', icon: '🗣️', color: '#5664c9' },
  { label: 'דיברתי עם הבחורה', icon: '💬', color: '#d66e9a' },
  { label: 'דיברתי עם שניהם', icon: '🤝', color: '#55b8b0' },
  { label: 'יש לקבוע פגישה', icon: '📅', color: '#e59a0c' },
  { label: 'נקבעה פגישה', icon: '✅', color: '#22a06b' },
  { label: 'עדכון המועמדים', icon: '🔔', color: '#3b82f6' },
  { label: 'הסתיים', icon: '🏁', color: '#8a91a3' },
] as const;
