'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DailyAffirmation() {
  const [affirmation, setAffirmation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAffirmation = async () => {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const storedAffirmation = localStorage.getItem('dailyAffirmation');
      const storedDate = localStorage.getItem('affirmationDate');

      if (storedAffirmation && storedDate === today) {
        setAffirmation(storedAffirmation);
        setIsLoading(false);
      } else {
        try {
          const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'system',
                  content: 'You are an inspiring assistant. Provide a short, positive affirmation for the day. Keep it to one sentence. Be encouraging and uplifting. Do not include any prefixes like "Here\'s an affirmation:". Just return the affirmation text directly.'
                },
                {
                  role: 'user',
                  content: 'Give me a daily affirmation.'
                }
              ],
              max_tokens: 50,
            },
            {
              headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
          const newAffirmation = response.data.choices[0].message.content.replace(/"/g, '');
          setAffirmation(newAffirmation);
          localStorage.setItem('dailyAffirmation', newAffirmation);
          localStorage.setItem('affirmationDate', today);
        } catch (error) {
          console.error('Error fetching daily affirmation:', error);
          setAffirmation('You are capable of amazing things! ✨'); // Fallback affirmation
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAffirmation();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">✨ Daily Affirmation ✨</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-4 w-full" />
        ) : (
          <p className="text-sm text-muted-foreground italic">"{affirmation}"</p>
        )}
      </CardContent>
    </Card>
  );
} 