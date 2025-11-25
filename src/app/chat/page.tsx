"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! Welcome to FocusRobin. I'm here to help you find the perfect eyewear. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot response (in real implementation, this would be an API call)
    setTimeout(() => {
      const botResponses = [
        "Thank you for your message! Our team will get back to you shortly. In the meantime, feel free to browse our collection.",
        "I understand your question. Let me connect you with one of our stylists who can provide personalized recommendations.",
        "That's a great question! You can find detailed information about our products on our shop page. Would you like me to help you find something specific?",
        "I'm here to help! For product inquiries, returns, or order support, our team is available via email at support@focusrobin.com.",
      ];

      const randomResponse =
        botResponses[Math.floor(Math.random() * botResponses.length)];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
                Chat with our stylists for instant advice and personalized recommendations
              </p>
            </div>

            {/* Chat Container */}
            <Card className="border border-gray-200 shadow-lg">
              <CardContent className="p-0">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-brand-teal to-brand-teal/80 p-4 sm:p-6 text-white">
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
                </div>

                {/* Messages Area */}
                <div className="h-[500px] sm:h-[600px] overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.sender === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.sender === "bot" && (
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
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
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
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <Input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-white border-gray-200 focus:border-brand-teal focus:ring-brand-teal"
                      disabled={isTyping}
                    />
                    <Button
                      type="submit"
                      disabled={!inputValue.trim() || isTyping}
                      className="bg-brand-teal text-white hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </form>
                  <p className="text-xs text-brand-blue/60 mt-2 text-center">
                    Press Enter to send • Our team typically responds within a few minutes
                  </p>
                </div>
              </CardContent>
            </Card>

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
                    href="tel:+37051234567"
                    className="text-sm text-brand-blue hover:text-brand-teal"
                  >
                    +370 5 123 4567
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

