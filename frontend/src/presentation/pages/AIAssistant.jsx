import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { chatApi } from '../../infrastructure/services/api/chat';

const PRESETS = [
  "Can I eat this?",
  "Suggest dinner",
  "Suggest breakfast",
  "Healthy alternatives",
  "High protein foods",
  "Low calorie snacks"
];

const formatMessage = (text) => {
  if (!text) return '';
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
  return { __html: formatted };
};

const AIAssistant = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm NutriMind AI. How can I help you reach your health goals today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await chatApi.askQuestion(text);
      setMessages(prev => [...prev, { role: 'ai', content: response.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0f1e' }}>

      {/* Header */}
      <header style={{
        background: 'rgba(15,22,41,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button id="btn-back" onClick={() => navigate('/dashboard')} className="btn-ghost text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00f590, #00d4b4)', boxShadow: '0 0 12px rgba(0,245,144,0.3)' }}>
              <Sparkles size={15} color="#0a0f1e" strokeWidth={2.5} />
            </div>
            <h1 className="text-base font-bold text-gradient">NutriMind Assistant</h1>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-6 space-y-5">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5"
                  style={{ background: 'linear-gradient(135deg, #00f590, #00d4b4)' }}>
                  <Bot size={16} color="#0a0f1e" strokeWidth={2.5} />
                </div>
              )}

              <div className="max-w-[85%] md:max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={msg.role === 'user' ? {
                  background: 'linear-gradient(135deg, #00f590, #00d4b4)',
                  color: '#0a0f1e',
                  fontWeight: 500,
                  borderBottomRightRadius: 6,
                  boxShadow: '0 4px 16px rgba(0,245,144,0.2)'
                } : {
                  background: '#141b2d',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#c4ccd8',
                  borderBottomLeftRadius: 6,
                }}>
                {msg.role === 'ai' ? (
                  <div dangerouslySetInnerHTML={formatMessage(msg.content)} />
                ) : msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 text-xs font-bold"
                  style={{ background: 'rgba(0,245,144,0.12)', color: '#00f590' }}>
                  <UserIcon size={16} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00f590, #00d4b4)' }}>
                <Bot size={16} color="#0a0f1e" strokeWidth={2.5} />
              </div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                style={{ background: '#141b2d', border: '1px solid rgba(255,255,255,0.06)', borderBottomLeftRadius: 6 }}>
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#00f590', animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="pb-6 pt-2">
          {/* Preset chips */}
          <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
            {PRESETS.map(preset => (
              <button
                key={preset}
                id={`preset-${preset.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => handleSend(preset)}
                disabled={isLoading}
                className="whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: 'rgba(0,245,144,0.08)',
                  border: '1px solid rgba(0,245,144,0.15)',
                  color: '#00f590',
                  flexShrink: 0
                }}>
                {preset}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: '#141b2d', border: '1px solid rgba(255,255,255,0.07)' }}>
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me about your diet…"
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: '#e8edf5' }}
            />
            <button
              id="chat-send"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #00f590, #00d4b4)', flexShrink: 0 }}>
              <Send size={16} color="#0a0f1e" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant;
