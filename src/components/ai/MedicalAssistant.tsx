import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Loader2, AlertCircle, BookOpen, TrendingUp, Activity } from 'lucide-react';
import { queryMedicalRAG, RAGQuery, RAGResponse } from '../../utils/medicalRAG';
import { useFirebase } from '../FirebaseProvider';
import { clsx } from 'clsx';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: RAGResponse['sources'];
  confidence?: number;
}

interface MedicalAssistantProps {
  patientId?: string;
  className?: string;
}

export const MedicalAssistant: React.FC<MedicalAssistantProps> = ({ 
  patientId, 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userData } = useFirebase();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserRole = (): RAGQuery['userRole'] => {
    if (!userData) return 'patient';
    switch (userData.role) {
      case 'ADMIN': return 'admin';
      case 'DOCTOR': 
      case 'CLINICIAN': return 'clinician';
      default: return 'patient';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const ragQuery: RAGQuery = {
        query: input.trim(),
        patientId,
        userRole: getUserRole(),
      };

      const response = await queryMedicalRAG(ragQuery);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        sources: response.sources,
        confidence: response.confidence,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get medical advice';
      setError(errorMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I'm having trouble accessing the medical knowledge base right now. Please try again or contact your healthcare provider for immediate assistance.",
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQueries = [
    "normal vital signs ranges",
    "blood pressure guidelines",
    "heart rate analysis",
    "oxygen saturation levels",
    "hypertension management",
    "diabetes monitoring",
  ];

  const handleSuggestedQuery = async (query: string) => {
    if (isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const ragQuery: RAGQuery = {
        query,
        patientId,
        userRole: getUserRole(),
      };

      const response = await queryMedicalRAG(ragQuery);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        sources: response.sources,
        confidence: response.confidence,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get medical advice';
      setError(errorMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I'm having trouble accessing the medical knowledge base right now. Please try again or contact your healthcare provider for immediate assistance.",
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-lg hover:bg-blue-700 transition-all',
          className
        )}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Medical AI Assistant</span>
        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
      </button>
    );
  }

  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Medical AI Assistant</h3>
            <p className="text-xs text-gray-600">Powered by medical knowledge base</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">How can I help you?</h4>
            <p className="text-sm text-gray-600 mb-4">
              Ask me about vital signs, medical conditions, or health monitoring
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Suggested questions:</p>
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuery(query)}
                  className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx(
              'flex gap-3',
              message.type === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.type === 'assistant' && (
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="h-4 w-4 text-white" />
              </div>
            )}
            <div
              className={clsx(
                'max-w-[80%] rounded-lg p-3',
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <BookOpen className="h-3 w-3" />
                    <span>Sources:</span>
                  </div>
                  {message.sources.slice(0, 2).map((source, index) => (
                    <div key={index} className="text-xs text-gray-500 truncate">
                      {source.title}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                {message.confidence && (
                  <span className={clsx(
                    'flex items-center gap-1',
                    message.confidence > 0.8 ? 'text-green-600' : 
                    message.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    <TrendingUp className="h-3 w-3" />
                    {Math.round(message.confidence * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing medical knowledge...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about medical conditions or vital signs..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          This AI assistant provides general medical information. Always consult healthcare professionals for medical advice.
        </p>
      </div>
    </div>
  );
};
