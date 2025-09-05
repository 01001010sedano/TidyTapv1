import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type TaskTemplate = {
  id?: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number; // in minutes
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: string[]; // for weekly tasks
  dayOfMonth?: number; // for monthly tasks
  room?: string;
  supplies?: string[];
  steps?: string[];
  householdId: string;
  createdBy: string;
  isDefault?: boolean; // system templates vs user templates
  usageCount?: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskTemplateCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
};

// Default template categories
export const DEFAULT_TEMPLATE_CATEGORIES: TaskTemplateCategory[] = [
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: '🍳',
    color: '#f59e0b',
    description: 'Kitchen cleaning and meal prep tasks'
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    icon: '🚿',
    color: '#3b82f6',
    description: 'Bathroom cleaning and maintenance'
  },
  {
    id: 'laundry',
    name: 'Laundry',
    icon: '👕',
    color: '#8b5cf6',
    description: 'Laundry and clothing care'
  },
  {
    id: 'living',
    name: 'Living Areas',
    icon: '🛋️',
    color: '#10b981',
    description: 'Living room, dining room, and common areas'
  },
  {
    id: 'bedroom',
    name: 'Bedrooms',
    icon: '🛏️',
    color: '#ec4899',
    description: 'Bedroom cleaning and organization'
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    icon: '🌳',
    color: '#059669',
    description: 'Yard work and outdoor maintenance'
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    icon: '🔧',
    color: '#6b7280',
    description: 'Home maintenance and repairs'
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛒',
    color: '#f97316',
    description: 'Grocery and household shopping'
  }
];

// Default task templates
export const DEFAULT_TEMPLATES: Omit<TaskTemplate, 'id' | 'householdId' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Kitchen Deep Clean',
    description: 'Thorough kitchen cleaning including appliances, counters, and floors',
    category: 'kitchen',
    priority: 'medium',
    estimatedTime: 45,
    room: 'Kitchen',
    supplies: ['All-purpose cleaner', 'Dish soap', 'Microfiber cloths', 'Sponge'],
    steps: [
      'Clear and wipe down all countertops',
      'Clean inside and outside of microwave',
      'Wipe down refrigerator exterior',
      'Clean stovetop and oven',
      'Sweep and mop floors',
      'Take out trash and recycling'
    ],
    isDefault: true,
    usageCount: 0
  },
  {
    title: 'Bathroom Clean',
    description: 'Complete bathroom cleaning and sanitization',
    category: 'bathroom',
    priority: 'medium',
    estimatedTime: 30,
    room: 'Bathroom',
    supplies: ['Bathroom cleaner', 'Toilet cleaner', 'Glass cleaner', 'Towels'],
    steps: [
      'Clean toilet bowl and seat',
      'Wipe down sink and counter',
      'Clean shower/tub',
      'Wipe down mirrors',
      'Sweep and mop floors',
      'Restock toiletries'
    ],
    isDefault: true,
    usageCount: 0
  },
  {
    title: 'Laundry Day',
    description: 'Complete laundry cycle including washing, drying, and folding',
    category: 'laundry',
    priority: 'low',
    estimatedTime: 120,
    room: 'Laundry Room',
    supplies: ['Laundry detergent', 'Fabric softener', 'Dryer sheets'],
    steps: [
      'Sort clothes by color and fabric type',
      'Load washing machine',
      'Transfer to dryer when complete',
      'Fold and organize clean clothes',
      'Put away in appropriate locations'
    ],
    isDefault: true,
    usageCount: 0
  },
  {
    title: 'Living Room Tidy',
    description: 'Quick living room organization and surface cleaning',
    category: 'living',
    priority: 'low',
    estimatedTime: 20,
    room: 'Living Room',
    supplies: ['Dust cloth', 'Vacuum cleaner'],
    steps: [
      'Pick up and organize items',
      'Dust surfaces and furniture',
      'Vacuum carpets and floors',
      'Fluff pillows and straighten cushions',
      'Empty trash bins'
    ],
    isDefault: true,
    usageCount: 0
  },
  {
    title: 'Grocery Shopping',
    description: 'Weekly grocery shopping trip',
    category: 'shopping',
    priority: 'high',
    estimatedTime: 60,
    room: 'Kitchen',
    supplies: ['Shopping list', 'Reusable bags'],
    steps: [
      'Check pantry and refrigerator',
      'Create shopping list',
      'Visit grocery store',
      'Purchase items on list',
      'Unpack and organize groceries'
    ],
    isDefault: true,
    usageCount: 0
  }
];

// Template management functions
export async function createTaskTemplate(template: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'taskTemplates'), {
    ...template,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getTaskTemplates(householdId: string): Promise<TaskTemplate[]> {
  const q = query(
    collection(db, 'taskTemplates'),
    where('householdId', '==', householdId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    lastUsed: doc.data().lastUsed?.toDate(),
  })) as TaskTemplate[];
}

export async function updateTaskTemplate(templateId: string, updates: Partial<TaskTemplate>): Promise<void> {
  const docRef = doc(db, 'taskTemplates', templateId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTaskTemplate(templateId: string): Promise<void> {
  const docRef = doc(db, 'taskTemplates', templateId);
  await deleteDoc(docRef);
}

export async function incrementTemplateUsage(templateId: string): Promise<void> {
  try {
    const docRef = doc(db, 'taskTemplates', templateId);
    const docSnap = await getDocs(query(collection(db, 'taskTemplates'), where('__name__', '==', templateId)));
    const currentUsage = docSnap.docs[0]?.data()?.usageCount || 0;
    
    await updateDoc(docRef, {
      usageCount: currentUsage + 1,
      lastUsed: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error incrementing template usage:', error);
  }
}

// Convert template to task
export function templateToTask(template: TaskTemplate, assignees: string[], dueDate?: Date): any {
  return {
    title: template.title,
    description: template.description,
    category: template.category,
    priority: template.priority,
    assignedTo: assignees.map(id => ({ id, name: id })), // You'll need to get actual names
    dueTime: dueDate?.toISOString() || new Date().toISOString(),
    status: 'pending',
    estimatedTime: template.estimatedTime,
    room: template.room,
    supplies: template.supplies,
    steps: template.steps,
    createdAt: new Date().toISOString(),
  };
} 