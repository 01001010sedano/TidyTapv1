import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ShrimpySuggestion = {
  title: string;
  description?: string;
  category?: string;
  suggestedDate: Timestamp;
  createdFromTaskId?: string;
  reason: string;
  assignedTo?: string;
  priority?: 'Low' | 'Medium' | 'High';
  repeat?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: string;
    dayOfMonth?: number;
  };
  status: 'pending' | 'accepted' | 'ignored';
  createdAt: Timestamp;
};

export async function createShrimpySuggestion(suggestion: Omit<ShrimpySuggestion, 'status' | 'createdAt'>) {
  await addDoc(collection(db, 'shrimpySuggestions'), {
    ...suggestion,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
} 