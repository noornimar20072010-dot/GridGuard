import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const question = input;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          transformer_id: null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText || response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'No response received',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      let errorMsg = 'Failed to get response';
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMsg = 'Request timed out. The assistant is taking longer than expected.';
        } else {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center h-14 w-14 rounded-full bg-ok hover:bg-ok/90 text-white shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-96 h-[600px] flex flex-col rounded-lg border border-line shadow-2xl"
          style={{
            backgroundColor: 'var(--color-panel)',
            borderColor: 'var(--color-line)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: 'var(--color-line)' }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-ok" />
              <h3 className="font-semibold text-white">Grid Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-raised rounded transition-colors"
              style={{ color: 'var(--color-ink)' }}
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ backgroundColor: 'var(--color-base)' }}
          >
            {messages.length === 0 && !error && (
              <div
                className="flex items-center justify-center h-full text-center"
                style={{ color: 'var(--color-ink)' }}
              >
                <div>
                  <p className="text-sm mb-2">Ask me about transformer status,</p>
                  <p className="text-sm">predictions, and grid alerts.</p>
                </div>
              </div>
            )}

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  borderWidth: '1px',
                }}
              >
                {error}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg p-3 text-sm ${
                    message.role === 'user'
                      ? 'text-white'
                      : ''
                  }`}
                  style={{
                    backgroundColor:
                      message.role === 'user'
                        ? 'var(--color-ok)'
                        : 'var(--color-raised)',
                    color: message.role === 'user' ? 'white' : 'var(--color-ink)',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: 'var(--color-raised)' }}
                >
                  <div className="flex gap-1">
                    <div
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{ backgroundColor: 'var(--color-ok)' }}
                    />
                    <div
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{
                        backgroundColor: 'var(--color-ok)',
                        animationDelay: '0.2s',
                      }}
                    />
                    <div
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{
                        backgroundColor: 'var(--color-ok)',
                        animationDelay: '0.4s',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t"
            style={{ borderColor: 'var(--color-line)' }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the grid..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-ok transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-base)',
                  borderColor: 'var(--color-line)',
                  color: 'var(--color-ink)',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-lg hover:bg-raised transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-ok)',
                  color: 'white',
                }}
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
