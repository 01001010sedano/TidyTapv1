import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ShrimpySuggestionsList() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'shrimpySuggestions'),
      where('status', '==', 'pending'),
      orderBy('suggestedDate', 'asc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setSuggestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAccept = async (sug: any) => {
    await addDoc(collection(db, 'tasks'), {
      title: sug.title,
      description: sug.description || '',
      category: sug.category || 'General',
      priority: sug.priority || 'Low',
      repeat: sug.repeat || null,
      assignedTo: sug.assignedTo || null,
      createdAt: serverTimestamp(),
      completed: false
    });
    await updateDoc(doc(db, 'shrimpySuggestions', sug.id), {
      status: 'accepted'
    });
  };

  const handleIgnore = async (sug: any) => {
    await updateDoc(doc(db, 'shrimpySuggestions', sug.id), {
      status: 'ignored'
    });
  };

  return (
    <Card className="p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">🧠 Suggested by Shrimpy</h2>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading suggestions…</p>
      ) : suggestions.length === 0 ? (
        <p className="text-muted-foreground text-sm">Shrimpy has no new suggestions right now 🦐💤</p>
      ) : (
        <div className="space-y-4">
          {suggestions.map((sug) => (
            <Card key={sug.id} className="p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{sug.title}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{sug.reason}</p>
                  <div className="text-xs text-muted">
                    Category: {sug.category || 'Uncategorized'} • Priority: {sug.priority || 'Low'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAccept(sug)}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => handleIgnore(sug)}>Ignore</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
} 