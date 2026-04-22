/**
 * Medical RAG Assistant Component
 * AI-powered assistant for querying patient medical history
 * Role-based responses (Clinician vs Patient)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, AlertCircle, FileText, Clock, X } from 'lucide-react';
import { motion } from 'motion/react';
import { queryMedicalRAG as queryAiRAG, RAGResponse } from '../utils/medicalRAG';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: RAGResponse['sources'];
  thinking?: boolean;
}

interface MedicalRAGAssistantProps {
  patientId?: string;
  userRole: 'clinician' | 'patient' | 'admin';
  userName: string;
  onClose?: () => void;
}

export const MedicalRAGAssistant: React.FC<MedicalRAGAssistantProps> = ({
  patientId,
  userRole,
  userName,
  onClose,
}) => {
  const inputId = React.useId();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        userRole === 'patient'
          ? `Welcome to your Health Information Assistant, ${userName}. I can help you understand your medical records and answer questions about your health. What would you like to know?`
          : `Welcome to the Medical AI Assistant, ${userRole === 'clinician' ? `Dr. ${userName}` : userName}. I can help you analyze patient medical history, identify trends, and support clinical decision-making. How can I assist you today?`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await queryAiRAG({
        query: input,
        patientId,
        userRole,
      });

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process query. Please try again.');
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error processing your query. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const placeholder =
    userRole === 'patient'
      ? 'Ask about your medical records, medications, conditions...'
      : 'Ask about patient medical history, clinical patterns, treatment response...';

  return (
    <div className="flex h-full max-h-[min(52rem,calc(100dvh-6rem))] min-h-[min(28rem,calc(100dvh-10rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:max-h-[min(56rem,calc(100dvh-7rem))] sm:rounded-2xl">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-emerald-600 to-blue-600 p-3 shadow-md dark:from-emerald-700 dark:to-blue-800 sm:p-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm sm:h-10 sm:w-10">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold leading-tight text-white sm:text-lg">Medical AI Assistant</h2>
            <p className="text-[10px] font-medium text-white/90 sm:text-xs">
              {userRole === 'clinician' ? 'Clinical support' : userRole === 'admin' ? 'Admin workspace' : 'Health information'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close assistant"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:space-y-4 sm:p-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[min(100%,28rem)] sm:max-w-2xl ${
                message.role === 'user'
                  ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-2xl rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none'
              } p-4 shadow-sm`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className={`mt-3 pt-3 border-t ${message.role === 'user' ? 'border-blue-500/30' : 'border-slate-100 dark:border-slate-700'} space-y-2`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${message.role === 'user' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    Sources & Citations:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {message.sources.map((source) => (
                      <div
                        key={source.id}
                        className={`text-xs p-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-500/20 text-blue-50'
                            : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-70" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{source.title}</p>
                            <div className="flex gap-2 items-center mt-0.5 opacity-70 text-[10px]">
                              <span className="capitalize">{source.type}</span>
                              <span>•</span>
                              <span>{source.date}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className={`text-[10px] mt-2 flex items-center gap-1 ${message.role === 'user' ? 'text-blue-100/70' : 'text-slate-400 dark:text-slate-500'}`}>
                <Clock className="w-3 h-3" />
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Loader className="w-4 h-4 animate-spin text-emerald-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Analyzing medical records...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-300">Analysis Error</p>
              <p className="text-sm text-red-700 dark:text-red-400/90">{error}</p>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Info Banner */}
      <div className="px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10 border-t border-slate-200 dark:border-slate-800">
        <p className="text-[10px] text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
          <span className="flex-shrink-0 w-4 h-4 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-[10px] font-bold">!</span>
          {userRole === 'patient'
            ? 'This assistant provides information about your medical records. Always consult with your doctor for medical advice.'
            : 'This AI assistant supports clinical decision-making. Always verify with primary sources and clinical judgment.'}
        </p>
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-800/50 sm:p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <input
            id={inputId}
            name="medical-rag-query"
            type="text"
            enterKeyHint="send"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-emerald-600 sm:min-h-0 sm:px-4"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600 sm:min-h-0 sm:px-5"
            aria-label="Send message"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            <span>{loading ? 'Processing…' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default MedicalRAGAssistant;
