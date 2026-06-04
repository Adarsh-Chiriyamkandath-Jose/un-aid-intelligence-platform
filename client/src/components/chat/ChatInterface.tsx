import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

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
    onError: () => {
      toast({
        variant: "destructive",
        title: "Couldn't reach the assistant",
        description:
          "The server may be waking up. Please try sending your message again.",
      });
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
      {/* Status Bar */}
      <div className="inline-flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border bg-card px-5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="status-dot" />
          <span className="text-sm font-medium text-muted-foreground">Online</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">GPT-4o</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">UN Dataset</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex min-w-0 items-center gap-3">
                  <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary ring-1 ring-primary/15 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold">Conversation</h3>
                    <p className="truncate text-sm text-muted-foreground font-normal">Ask anything about international aid data</p>
                  </div>
                </CardTitle>
                <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary">
                  <Clock className="h-3 w-3 mr-1" />
                  Real-time
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4 sm:p-6">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-1 sm:pr-2 max-h-[60vh] sm:max-h-[500px]">
                {allMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 sm:gap-4 ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'assistant'
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/15'
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <Sparkles className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 max-w-3xl ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'chat-bubble-user rounded-tr-md'
                          : 'chat-bubble-ai rounded-tl-md'
                      }`}>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'assistant' ? 'text-foreground' : 'text-primary-foreground'
                        }`}>
                          {msg.content}
                        </p>

                        {msg.metadata?.confidence && (
                          <div className={`mt-3 pt-3 border-t flex items-center gap-2 ${msg.role === 'user' ? 'border-white/25' : 'border-border'}`}>
                            <CheckCircle className={`h-4 w-4 ${msg.role === 'user' ? 'text-white/80' : 'text-emerald-500'}`} />
                            <span className={`text-xs ${msg.role === 'user' ? 'text-white/80' : 'text-muted-foreground'}`}>
                              Confidence: {Math.round(msg.metadata.confidence * 100)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <p className={`text-xs text-muted-foreground mt-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt || msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {sendMessageMutation.isPending && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary ring-1 ring-primary/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="chat-bubble-ai p-4 rounded-2xl rounded-tl-md">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                          <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                          <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                        </div>
                        <span className="text-sm text-muted-foreground">AI is thinking…</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="relative">
                <div className="flex items-center gap-3 p-2.5 bg-secondary/60 rounded-2xl border border-border focus-within:ring-2 focus-within:ring-ring/40 transition-shadow">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask about aid flows, donors, sectors, or forecasts…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sendMessageMutation.isPending || !message.trim()}
                    size="lg"
                    className="rounded-xl"
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
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Queries
              </CardTitle>
              <p className="text-sm text-muted-foreground">Jump-start your analysis</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickQueries.map((query, index) => {
                const IconComponent = query.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    size="lg"
                    className="w-full justify-start h-auto p-3.5 text-left border border-border hover:border-primary/30 hover:bg-accent rounded-xl transition-all duration-200"
                    onClick={() => sendQuickQuery(query.text)}
                    disabled={sendMessageMutation.isPending}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {query.text}
                        </p>
                        <p className="text-xs text-muted-foreground">
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
