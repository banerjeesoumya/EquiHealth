import React, { useState, useRef, useEffect } from 'react';
import axios from '../../lib/axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const initialMessages: Message[] = [
  { sender: 'bot', text: 'Hi!' },
  { sender: 'bot', text: 'How can I help you today?' },
];

const SYSTEM_MESSAGE = {
  role: 'system',
  content:
    'You are an AI-powered healthcare assistant for the platform Equihealth. Your role is to assist users with general health-related queries in a friendly and informative manner. You are not a doctor and cannot provide medical diagnoses.'
};

function getCachedHistory(): { role: string; content: string }[] {
  try {
    const raw = localStorage.getItem('chatHistory');
    if (!raw) return [];
    const parsed: Message[] = JSON.parse(raw);
    // Only keep last 2 user+bot pairs
    const pairs = [];
    let count = 0;
    for (let i = parsed.length - 1; i >= 0 && count < 4; i--) {
      pairs.unshift(parsed[i]);
      count++;
    }
    // Convert to OpenAI format
    return pairs.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  } catch {
    return [];
  }
}

function setCachedHistory(messages: Message[]) {
  try {
    // Only store last 4 messages (2 pairs)
    const last = messages.slice(-4);
    localStorage.setItem('chatHistory', JSON.stringify(last));
  } catch {}
}

// Helper to convert OpenAI messages to Message[] if needed in future
function openAiToMessage(msg: { role: string; content: string }): Message {
  return {
    sender: msg.role === 'user' ? 'user' : 'bot',
    text: msg.content,
  };
}

export default function HealthAssistantChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages(initialMessages);
      // Optionally clear chatHistory on open, or load it
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user' as const, text: input };
    setMessages((msgs) => [...msgs, userMessage]);
    setInput('');
    setLoading(true);
    try {
      // Prepare context: system + last 2 pairs + new user message
      const context = getCachedHistory();
      const apiMessages = [
        SYSTEM_MESSAGE,
        ...context,
        { role: 'user', content: input }
      ];
      const res = await axios.post('/user/chat-support', { messages: apiMessages });
      const botText = res.data.reply || 'Sorry, I could not understand that.';
      setMessages((msgs) => {
        const updated: Message[] = [...msgs, { sender: 'bot', text: botText }];
        setCachedHistory(updated);
        return updated;
      });
    } catch (err) {
      setMessages((msgs) => {
        const updated: Message[] = [...msgs, { sender: 'bot', text: 'Sorry, there was an error. Please try again.' }];
        setCachedHistory(updated);
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
      <Card className="w-[580px] shadow-lg border-primary border-2 rounded-xl flex flex-col bg-background">
        <CardContent className="p-0 flex flex-col h-[550px]">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-primary/10 rounded-t-xl">
            <span className="font-semibold text-primary">Health Assistant</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-primary">
              <X size={18} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-background">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-[85%] text-sm shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {msg.sender === 'bot' ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Health Assistant is typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center gap-2 border-t px-4 py-2 bg-background rounded-b-xl">
            <Input
              className="flex-1"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={loading}
              autoFocus
            />
            <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send size={18} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 