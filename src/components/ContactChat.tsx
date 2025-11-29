"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Bot, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sendUserMessage,
  getUserChatMessages,
} from "@/app/actions/chat";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "admin";
  timestamp: Date;
}

const CHAT_ID_STORAGE_KEY = "focusrobin_chat_id";

interface ContactChatProps {
  initialChatId?: string;
}

export default function ContactChat({ initialChatId }: ContactChatProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(initialChatId);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chatId from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !chatId) {
      const savedChatId = localStorage.getItem(CHAT_ID_STORAGE_KEY);
      if (savedChatId) {
        setChatId(savedChatId);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen && chatId) {
      loadMessages();
    }
  }, [isOpen, chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!chatId) return;

    setIsLoading(true);
    try {
      const result = await getUserChatMessages(chatId);
      if (result.success && result.messages) {
        setMessages(
          result.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

    try {
      const result = await sendUserMessage(
        messageText,
        session?.user?.email || undefined,
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
          }
        }
        // Reload messages to get the actual saved message
        await loadMessages();
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

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-brand-teal text-white hover:bg-brand-teal/90 rounded-full h-14 w-14 shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open chat</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <Card className="border border-gray-200 shadow-2xl flex flex-col h-[600px]">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal/80 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-headline font-semibold text-lg">
                  FocusRobin Support
                </h3>
                <p className="text-sm opacity-90">We're here to help</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close chat</span>
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
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
                      "max-w-[80%] rounded-lg px-4 py-3",
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
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
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
                size="icon"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

