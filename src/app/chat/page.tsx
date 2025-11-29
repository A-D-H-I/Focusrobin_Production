"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Bot, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  sendUserMessage,
  getUserChatMessages,
  getUserChats,
  getUserChatsByEmail,
} from "@/app/actions/chat";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Clock } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "admin";
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  status: string;
  lastMessageAt: Date;
  createdAt: Date;
  lastMessage: {
    text: string;
    sender: "user" | "admin";
    timestamp: Date;
  } | null;
}

const CHAT_ID_STORAGE_KEY = "focusrobin_chat_id";

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const isUserScrollingRef = useRef(false);

  const scrollToBottom = useCallback((force = false) => {
    if (!force && !shouldAutoScroll) return;
    
    // Check if user is near bottom (within 100px)
    if (messagesContainerRef.current && !force) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (!isNearBottom) {
        // User has scrolled up, don't auto-scroll
        return;
      }
    }

    setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [shouldAutoScroll]);

  // Only auto-scroll when new messages are added (not on every render)
  const prevMessagesLengthRef = useRef(0);
  useEffect(() => {
    // Only scroll if messages actually increased (new message added)
    if (messages.length > prevMessagesLengthRef.current && shouldAutoScroll) {
      scrollToBottom(true);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, shouldAutoScroll, scrollToBottom]);

  // Track user scroll to prevent auto-scroll when user is reading old messages
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  }, []);

  const [chatStatus, setChatStatus] = useState<{
    status: string;
    forceClosed: boolean;
  } | null>(null);

  // Load messages when chatId is available
  const loadMessages = useCallback(async () => {
    if (!chatId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getUserChatMessages(chatId);
      if (result.success && result.messages) {
        const loadedMessages = result.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(loadedMessages);
        if (result.status) {
          setChatStatus({
            status: result.status,
            forceClosed: result.forceClosed || false,
          });
        }
        // Auto-scroll after loading messages
        setShouldAutoScroll(true);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  // Load chat history and set active chat on mount (only once)
  useEffect(() => {
    let isMounted = true;
    
    const loadChatHistory = async () => {
      setIsLoadingHistory(true);
      try {
        let result;
        if (session?.user) {
          // For logged-in users
          result = await getUserChats();
        } else if (typeof window !== "undefined") {
          // For anonymous users, try to get by email from localStorage
          const savedEmail = localStorage.getItem("focusrobin_user_email");
          if (savedEmail) {
            result = await getUserChatsByEmail(savedEmail);
          } else {
            result = { success: true, chats: [] };
          }
        } else {
          result = { success: true, chats: [] };
        }

        if (!isMounted) return;

        if (result.success && result.chats) {
          setChatHistory(result.chats);

          // Set the most recent open chat, or use saved chatId
          if (typeof window !== "undefined") {
            const savedChatId = localStorage.getItem(CHAT_ID_STORAGE_KEY);
            const openChat = result.chats.find((c: ChatHistory) => c.status === "OPEN");
            
            if (savedChatId && result.chats.some((c: ChatHistory) => c.id === savedChatId)) {
              // Use saved chatId if it exists in history
              setChatId(savedChatId);
            } else if (openChat) {
              // Use most recent open chat
              setChatId(openChat.id);
              localStorage.setItem(CHAT_ID_STORAGE_KEY, openChat.id);
            } else {
              // No open chats, show welcome message
              setChatId(undefined);
              setMessages([
                {
                  id: "welcome",
                  text: "Hello! Welcome to FocusRobin. I'm here to help you find the perfect eyewear. How can I assist you today?",
                  sender: "admin",
                  timestamp: new Date(),
                },
              ]);
              setIsLoading(false);
            }
          }
        } else {
          // No chats found, show welcome message
          setChatId(undefined);
          setMessages([
            {
              id: "welcome",
              text: "Hello! Welcome to FocusRobin. I'm here to help you find the perfect eyewear. How can I assist you today?",
              sender: "admin",
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadChatHistory();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, session?.user?.email]); // Only run when user changes

  // Load messages when chatId is available
  useEffect(() => {
    if (chatId) {
      loadMessages();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); // Only depend on chatId, not loadMessages to prevent loops

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const messageText = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    // Optimistically add user message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    // Enable auto-scroll when user sends a message
    setShouldAutoScroll(true);

    try {
      const userEmail = session?.user?.email || undefined;
      const result = await sendUserMessage(
        messageText,
        userEmail,
        session?.user?.name || undefined,
        (session?.user as any)?.id || undefined,
        chatId
      );

      if (result.success) {
        if (result.chatId) {
          setChatId(result.chatId);
          // Save chatId to localStorage for persistence
          if (typeof window !== "undefined") {
            localStorage.setItem(CHAT_ID_STORAGE_KEY, result.chatId);
            // Save email for anonymous users (if email was provided)
            if (!session?.user && userEmail) {
              localStorage.setItem("focusrobin_user_email", userEmail);
            }
          }
        }
        // Reload messages (this will trigger scroll)
        await loadMessages();
        // Reload chat history in background (don't await to avoid blocking)
        if (session?.user) {
          getUserChats().then((result) => {
            if (result.success && result.chats) {
              setChatHistory(result.chats);
            }
          }).catch(console.error);
        } else if (typeof window !== "undefined") {
          const savedEmail = localStorage.getItem("focusrobin_user_email");
          if (savedEmail) {
            getUserChatsByEmail(savedEmail).then((result) => {
              if (result.success && result.chats) {
                setChatHistory(result.chats);
              }
            }).catch(console.error);
          }
        }
      } else {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
        alert(result.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const handleSelectChat = (selectedChatId: string) => {
    setChatId(selectedChatId);
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAT_ID_STORAGE_KEY, selectedChatId);
    }
    setShowHistory(false);
  };

  const handleNewChat = () => {
    setChatId(undefined);
    setMessages([
      {
        id: "welcome",
        text: "Hello! Welcome to FocusRobin. I'm here to help you find the perfect eyewear. How can I assist you today?",
        sender: "admin",
        timestamp: new Date(),
      },
    ]);
    setChatStatus(null);
    setIsLoading(false);
    setInputValue("");
    setShouldAutoScroll(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem(CHAT_ID_STORAGE_KEY);
    }
    setShowHistory(false);
    // Scroll to bottom to show welcome message
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-white">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-teal/10 rounded-full mb-4">
                <MessageCircle className="h-8 w-8 text-brand-teal" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-headline font-bold text-brand-blue mb-4">
                Live Chat
              </h1>
              <p className="text-brand-blue/80 max-w-2xl mx-auto">
                Contact us for help regarding anything and Chat with our stylists for instant advice and personalized recommendations
              </p>
            </div>

            {/* Chat Container */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Chat History Sidebar */}
              <Card className="lg:col-span-1 border border-gray-200 hidden lg:block">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-headline font-semibold text-brand-blue">
                      Chat History
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNewChat}
                      className="h-8 w-8 p-0"
                      title="New Chat"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="h-[600px] overflow-y-auto">
                    {isLoadingHistory ? (
                      <div className="p-4 text-center text-sm text-brand-blue/60">
                        Loading...
                      </div>
                    ) : chatHistory.length === 0 ? (
                      <div className="p-4 text-center text-sm text-brand-blue/60">
                        <p className="mb-2">No chat history</p>
                        <p className="text-xs">Start a new conversation!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {chatHistory.map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => handleSelectChat(chat.id)}
                            className={cn(
                              "w-full text-left p-4 hover:bg-gray-50 transition-colors",
                              chatId === chat.id && "bg-brand-teal/10 border-l-4 border-brand-teal"
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <MessageSquare className="h-4 w-4 text-brand-teal flex-shrink-0" />
                                <Badge
                                  variant={
                                    chat.status === "OPEN"
                                      ? "default"
                                      : chat.status === "CLOSED"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {chat.status}
                                </Badge>
                              </div>
                            </div>
                            {chat.lastMessage && (
                              <p className="text-sm text-brand-blue line-clamp-2 mb-2">
                                {chat.lastMessage.text}
                              </p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-brand-blue/60">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(chat.lastMessageAt)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Chat History Button */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full mb-4"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {showHistory ? "Hide" : "Show"} Chat History
                </Button>
              </div>

              {/* Mobile Chat History Panel */}
              {showHistory && (
                <Card className="lg:hidden border border-gray-200 mb-4">
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-headline font-semibold text-brand-blue">
                        Chat History
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleNewChat}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHistory(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {isLoadingHistory ? (
                        <div className="p-4 text-center text-sm text-brand-blue/60">
                          Loading...
                        </div>
                      ) : chatHistory.length === 0 ? (
                        <div className="p-4 text-center text-sm text-brand-blue/60">
                          <p className="mb-2">No chat history</p>
                          <p className="text-xs">Start a new conversation!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {chatHistory.map((chat) => (
                            <button
                              key={chat.id}
                              onClick={() => handleSelectChat(chat.id)}
                              className={cn(
                                "w-full text-left p-4 hover:bg-gray-50 transition-colors",
                                chatId === chat.id && "bg-brand-teal/10"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge
                                  variant={
                                    chat.status === "OPEN"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {chat.status}
                                </Badge>
                              </div>
                              {chat.lastMessage && (
                                <p className="text-sm text-brand-blue line-clamp-2 mb-2">
                                  {chat.lastMessage.text}
                                </p>
                              )}
                              <div className="flex items-center gap-1 text-xs text-brand-blue/60">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(chat.lastMessageAt)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Chat Area */}
              <Card className="lg:col-span-3 border border-gray-200 shadow-lg">
              <CardContent className="p-0">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-brand-teal to-brand-teal/80 p-4 sm:p-6 text-white">
                    <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-headline font-semibold text-lg">
                        FocusRobin Support
                      </h2>
                      <p className="text-sm opacity-90">
                        Usually replies within a few minutes
                      </p>
                        </div>
                      </div>
                      <div className="lg:hidden">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHistory(!showHistory)}
                          className="text-white hover:bg-white/20"
                        >
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="h-[500px] sm:h-[600px] overflow-y-auto p-4 sm:p-6 bg-gray-50/50"
                >
                  <div className="space-y-4">
                    {isLoading && messages.length === 0 ? (
                      <div className="text-center text-brand-blue/60 py-8">
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-brand-blue/60 py-8">
                        <p className="mb-2">Start a conversation!</p>
                        <p className="text-sm">
                          Send us a message and we'll get back to you soon.
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.sender === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.sender === "admin" && (
                          <div className="flex-shrink-0 w-8 h-8 bg-brand-teal/10 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-brand-teal" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] sm:max-w-[70%] rounded-lg px-4 py-3",
                            message.sender === "user"
                              ? "bg-brand-teal text-white"
                              : "bg-white border border-gray-200 text-brand-blue"
                          )}
                        >
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <p
                            className={cn(
                              "text-xs mt-2",
                              message.sender === "user"
                                ? "text-white/70"
                                : "text-brand-blue/60"
                            )}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                        {message.sender === "user" && (
                          <div className="flex-shrink-0 w-8 h-8 bg-brand-blue/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-brand-blue" />
                          </div>
                        )}
                      </div>
                    ))
                    )}

                    {/* Typing Indicator */}
                    {isSending && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-brand-teal/10 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-brand-teal" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-brand-blue/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 bg-brand-blue/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-2 h-2 bg-brand-blue/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-4 sm:p-6 bg-white">
                  {chatStatus?.forceClosed ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-sm font-semibold text-red-800 mb-2">
                        This chat has been permanently closed
                      </p>
                      <p className="text-xs text-red-600 mb-3">
                        You cannot send messages to this chat. If your issue is not resolved, please start a new conversation.
                      </p>
                      <Button
                        onClick={handleNewChat}
                        className="bg-brand-teal text-white hover:bg-brand-teal/90"
                        size="sm"
                      >
                        Start New Chat
                      </Button>
                    </div>
                  ) : chatStatus?.status === "CLOSED" ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">
                        This chat has been closed
                      </p>
                      <p className="text-xs text-yellow-600 mb-3">
                        If your issue is not resolved, you can continue the conversation by sending a message below.
                      </p>
                      <form onSubmit={handleSendMessage} className="flex gap-3">
                        <Input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Type your message to continue..."
                          className="flex-1 bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal"
                          disabled={isSending}
                        />
                        <Button
                          type="submit"
                          disabled={!inputValue.trim() || isSending}
                          className="bg-brand-teal text-white hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-4 w-4" />
                          <span className="sr-only">Send</span>
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <>
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <Input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal"
                          disabled={isSending}
                    />
                    <Button
                      type="submit"
                          disabled={!inputValue.trim() || isSending}
                      className="bg-brand-teal text-white hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </form>
                  <p className="text-xs text-brand-blue/60 mt-2 text-center">
                    Press Enter to send • Our team typically responds within a few minutes
                  </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Additional Help Section */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border border-gray-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-semibold text-brand-blue mb-1">
                    Email Support
                  </p>
                  <a
                    href="mailto:support@focusrobin.com"
                    className="text-sm text-brand-teal hover:underline"
                  >
                    support@focusrobin.com
                  </a>
                </CardContent>
              </Card>
              <Card className="border border-gray-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-semibold text-brand-blue mb-1">
                    Phone Support
                  </p>
                  <a
                    href="tel:+37060966069"
                    className="text-sm text-brand-blue hover:text-brand-teal"
                  >
                    +370 609 66069
                  </a>
                </CardContent>
              </Card>
              <Card className="border border-gray-200">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-semibold text-brand-blue mb-1">
                    Business Hours
                  </p>
                  <p className="text-sm text-brand-blue/80">
                    Mon-Fri: 9AM-6PM EET
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

