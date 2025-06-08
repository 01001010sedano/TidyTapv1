'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TaskResponse {
  title: string;
  description: string;
  priority: string;
  assignedTo: string;
}

export function ShrimpyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();

    // Prevent helpers from using /add
    if (userMessage.startsWith('/add') && user?.role === 'helper') {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: 'Invalid command: Only managers can add tasks. 🦐' }
      ]);
      setInput('');
      return;
    }

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are Shrimpy — a cute vacuum shrimp who helps users clean, organize tasks, and stay motivated. Keep replies short, helpful, and fun. Use emojis like 🧽🦐✨. If the message starts with "/add", extract a task title, optional description, priority, category, assignee, dueDate (YYYY-MM-DD), dueTime (HH:mm), and optionally a repeat rule (daily, weekly on a specific day, or monthly on a specific date). Return the result as a JSON object.'
            },
            ...messages,
            { role: 'user', content: userMessage }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const assistantMessage = response.data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      // If it's a task response, parse it and add to Firestore
      if (userMessage.startsWith('/add')) {
        try {
          const raw = JSON.parse(assistantMessage);
          // Accept both 'title' or 'task', and 'assignedTo' or 'assignee'
          const title = raw.title || raw.task;
          const description = raw.description || '';
          const priority = (raw.priority || 'medium').toLowerCase();
          const assignee = raw.assignedTo || raw.assignee;
          const category = raw.category || '';
          const repeat = raw.repeat;
          const dueDate = raw.dueDate;
          const dueTime = raw.dueTime;
          let dueTimeISO = new Date().toISOString();
          if (dueDate && dueTime) {
            dueTimeISO = new Date(`${dueDate}T${dueTime}`).toISOString();
          } else if (dueDate) {
            dueTimeISO = new Date(`${dueDate}T00:00`).toISOString();
          }

          if (!title || !assignee) {
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: 'Sorry, I could not extract a valid task title or assignee from your message. 🦐' }
            ]);
            return;
          }

          if (user && user.householdId) {
            const assignedToArr = [
              {
                id: assignee,
                name: assignee,
              },
            ];
            const newTask = {
              title,
              description,
              priority,
              category,
              assignedTo: assignedToArr,
              dueTime: dueTimeISO,
              status: 'pending',
              householdId: user.householdId,
              createdAt: new Date().toISOString(),
              createdBy: user.id,
              repeat: repeat || null,
            };
            await addDoc(collection(db, 'tasks'), newTask);
          }
        } catch (e) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: 'Sorry, I could not parse the task details. Please try again! 🦐' }
          ]);
          console.error('Failed to parse or save task response:', e);
        }
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Oops! 🦐 Something went wrong. Please try again!' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 rounded-full w-16 h-16 shadow-lg z-[9999]"
      >
        🦐 Chat
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-4 w-96 shadow-xl z-[9999]">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Shrimpy Chat 💬</h2>
          </div>
          
          <ScrollArea className="h-[200px] p-4">
            <div ref={scrollRef} className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    Thinking... 🦐
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                Send
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
} 