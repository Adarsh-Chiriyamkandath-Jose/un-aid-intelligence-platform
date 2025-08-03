import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, MessageSquare, Brain, CheckCircle, User, Sparkles, Bot, Clock, Zap, Globe, BarChart3, TrendingUp, Database } from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    context?: string[];
    citations?: string[];
    confidence?: number;
  };
  createdAt: string;
}

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: chatHistory, refetch: refetchHistory } = useQuery({
    queryKey: [`/api/chat/history/${sessionId}`],
    enabled: true,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      const response = await apiRequest('POST', '/api/chat/message', {
        message: messageContent,
        sessionId,
      });
      return response.json();
    },
    onSuccess: () => {
      refetchHistory();
      setMessage('');
      inputRef.current?.focus();
    },
  });

  const quickQueries = [
    { 
      text: "Show aid trends for Africa", 
      icon: TrendingUp,
      category: "Trends"
    },
    { 
      text: "Compare health vs education funding", 
      icon: BarChart3,
      category: "Analysis" 
    },
    { 
      text: "Top donors by region", 
      icon: Globe,
      category: "Donors"
    },
    { 
      text: "Forecast aid for 2025", 
      icon: Zap,
      category: "Forecast"
    },
  ];

  const sendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const sendQuickQuery = (query: string) => {
    sendMessageMutation.mutate(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Initial AI greeting
  const initialMessages = [
    {
      id: 'welcome',
      role: 'assistant' as const,
      content: "Hello! I'm your AI assistant for international development aid analysis. I can help you explore global aid trends, analyze donor patterns, and provide insights based on real UN aid data (2015-2023).\n\nWhat would you like to know?",
      metadata: { confidence: 1.0 },
      createdAt: new Date().toISOString(),
    }
  ];

  const allMessages = [...initialMessages, ...(Array.isArray(chatHistory) ? chatHistory : [])];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Assistant
          </h1>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Advanced AI-powered analysis for international development aid data. Get insights, trends, and forecasts from real UN data spanning 2015-2023.
          </p>
        </div>
        
        {/* Status Bar */}
        <div className="inline-flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Online</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GPT-4o</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">UN Dataset</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Conversation</h3>
                    <p className="text-sm text-gray-500 font-normal">Ask anything about international aid data</p>
                  </div>
                </CardTitle>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  <Clock className="h-3 w-3 mr-1" />
                  Real-time
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-6">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 max-h-[500px]">
                {allMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-4 ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'assistant' 
                        ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' 
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <Sparkles className="h-5 w-5 text-white" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div className={`flex-1 max-w-3xl ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-4 rounded-2xl shadow-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-md'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-md'
                      }`}>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'assistant' ? 'text-gray-800 dark:text-gray-200' : 'text-white'
                        }`}>
                          {msg.content}
                        </p>
                        
                        {msg.metadata?.confidence && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center gap-2">
                            <CheckCircle className={`h-4 w-4 ${msg.role === 'user' ? 'text-blue-200' : 'text-green-500'}`} />
                            <span className={`text-xs ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                              Confidence: {Math.round(msg.metadata.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Timestamp */}
                      <p className={`text-xs text-gray-400 mt-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt || msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {sendMessageMutation.isPending && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl rounded-tl-md shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                        </div>
                        <span className="text-sm text-gray-500">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="relative">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask about aid flows, donors, sectors, or forecasts..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 border-0 bg-transparent text-base placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sendMessageMutation.isPending || !message.trim()}
                    size="lg"
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Queries */}
          <Card className="shadow-lg border-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Queries
              </CardTitle>
              <p className="text-sm text-gray-500">Jump-start your analysis</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickQueries.map((query, index) => {
                const IconComponent = query.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    size="lg"
                    className="w-full justify-start h-auto p-4 text-left hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-200"
                    onClick={() => sendQuickQuery(query.text)}
                    disabled={sendMessageMutation.isPending}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {query.text}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {query.category}
                        </p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}
