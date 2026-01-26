"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2, Trash2, Package, Truck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const CHAT_HISTORY_KEY = "focusrobin_chat_history";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: {
    type: "orders" | "order_status" | "refund_eligibility";
    orders?: Order[];
    order?: OrderStatus;
    eligibility?: RefundEligibility;
  };
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  currency: string;
  createdAt: string;
  items: {
    productName: string;
    variantName: string;
    quantity: number;
    price: string;
  }[];
}

interface OrderStatus {
  orderNumber: string;
  status: string;
  statusMessage: string;
  trackingNumber: string | null;
  trackingMessage: string | null;
  shippingProvider: string | null;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
}

interface RefundEligibility {
  orderNumber: string;
  status: string;
  isEligible: boolean;
  daysSinceOrder: number;
  reason: string;
}

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastContext, setLastContext] = useState<"status" | "refund" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filter and validate messages to ensure they have required fields
            const validMessages = parsed.filter(
              (msg: any) =>
                msg &&
                typeof msg === "object" &&
                msg.id &&
                msg.role &&
                (msg.role === "user" || msg.role === "assistant") &&
                (typeof msg.content === "string" || msg.data)
            );
            setMessages(validMessages);
          }
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        localStorage.removeItem(CHAT_HISTORY_KEY);
      }
    }
  }, []);

  // Save chat history whenever messages change
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      try {
        // Keep last 50 messages to prevent storage overflow
        const messagesToSave = messages.slice(-50);
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToSave));
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Clear chat history
  const clearChatHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }, []);

  // Send message to chatbot
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    // Detect context from user message
    const lowerText = text.toLowerCase();
    if (lowerText.includes("refund") || lowerText.includes("money back")) {
      setLastContext("refund");
    } else if (lowerText.includes("status") || lowerText.includes("track") || lowerText.includes("where")) {
      setLastContext("status");
    }

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content || data.text || "",
        data: data.data,
        createdAt: new Date().toISOString(),
      };

      // Update context based on bot response
      if (data.data?.type === "refund_eligibility") {
        setLastContext(null); // Clear context after showing result
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setErrorMessage(error.message || "Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Handle clicking on an order - context-aware (refund vs status)
  const handleOrderClick = (orderNumber: string) => {
    if (lastContext === "refund") {
      sendMessage(`Check refund eligibility for order ${orderNumber}`);
    } else {
      sendMessage(`Check status of order ${orderNumber}`);
    }
  };

  // Render order card
  const renderOrderCard = (order: Order) => {
    const statusColors: Record<string, string> = {
      DELIVERED: "bg-green-100 text-green-800",
      SHIPPED: "bg-blue-100 text-blue-800",
      PROCESSING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-purple-100 text-purple-800",
      PENDING: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800",
      REFUNDED: "bg-orange-100 text-orange-800",
    };

    return (
      <Card
        key={order.id}
        className="p-2 sm:p-3 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={() => handleOrderClick(order.orderNumber)}
      >
        <div className="flex justify-between items-start mb-1.5 sm:mb-2 gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs sm:text-sm flex items-center gap-1 truncate">
              <Package className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{order.orderNumber}</span>
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span
            className={cn(
              "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium flex-shrink-0",
              statusColors[order.status] || "bg-gray-100 text-gray-800"
            )}
          >
            {order.status}
          </span>
        </div>
        <div className="text-xs sm:text-sm">
          <p className="font-medium">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </p>
          <p className="text-muted-foreground">
            Total: {order.currency} {order.total}
          </p>
        </div>
      </Card>
    );
  };

  // Render order status
  const renderOrderStatus = (order: OrderStatus) => {
    const statusColors: Record<string, string> = {
      DELIVERED: "bg-green-100 text-green-800",
      SHIPPED: "bg-blue-100 text-blue-800",
      PROCESSING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-purple-100 text-purple-800",
      PENDING: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800",
      REFUNDED: "bg-orange-100 text-orange-800",
    };

    return (
      <Card className="p-2.5 sm:p-4 bg-muted/50">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm flex items-center gap-1">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{order.orderNumber}</span>
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Ordered: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span
              className={cn(
                "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium flex-shrink-0",
                statusColors[order.status] || "bg-gray-100 text-gray-800"
              )}
            >
              {order.status}
            </span>
          </div>

          <p className="text-xs sm:text-sm break-words">{order.statusMessage}</p>

          {order.trackingNumber && (
            <div className="text-xs sm:text-sm bg-background/50 p-1.5 sm:p-2 rounded">
              <p className="font-medium flex items-center gap-1 break-words">
                <Truck className="h-3 w-3 flex-shrink-0" />
                <span>Tracking: {order.trackingNumber}</span>
              </p>
              {order.shippingProvider && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  via {order.shippingProvider}
                </p>
              )}
              {order.trackingMessage && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 italic break-words">
                  {order.trackingMessage}
                </p>
              )}
            </div>
          )}

          <div className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5 sm:space-y-1">
            {order.shippedAt && (
              <p>Shipped: {new Date(order.shippedAt).toLocaleDateString()}</p>
            )}
            {order.deliveredAt && (
              <p>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // Render refund eligibility
  const renderRefundEligibility = (eligibility: RefundEligibility) => {
    return (
      <Card
        className={cn(
          "p-2.5 sm:p-4",
          eligibility.isEligible
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        )}
      >
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0", eligibility.isEligible ? "text-green-600" : "text-yellow-600")} />
            <p className="font-semibold text-xs sm:text-sm break-words">
              {eligibility.isEligible ? "✓ Eligible for Refund" : "Not Eligible for Refund"}
            </p>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">{eligibility.reason}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Order: {eligibility.orderNumber} • {eligibility.daysSinceOrder} days since delivery
          </p>
        </div>
      </Card>
    );
  };

  // Render message data (orders, status, etc.)
  const renderMessageData = (data: Message["data"]) => {
    if (!data) return null;

    switch (data.type) {
      case "orders":
        return (
          <div className="space-y-2 mt-2">
            {data.orders?.map((order) => renderOrderCard(order))}
          </div>
        );
      case "order_status":
        return data.order ? (
          <div className="mt-2">{renderOrderStatus(data.order)}</div>
        ) : null;
      case "refund_eligibility":
        return data.eligibility ? (
          <div className="mt-2">{renderRefundEligibility(data.eligibility)}</div>
        ) : null;
      default:
        return null;
    }
  };

  // Sanitize HTML to prevent XSS attacks
  const sanitizeHtml = (input: string): string => {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  };

  // Format message content with markdown-like styling
  const formatContent = (content: string | undefined | null) => {
    if (!content) return null;
    // Simple markdown-like formatting
    return content.split("\n").map((line, i) => {
      // First sanitize the input to prevent XSS
      let sanitizedLine = sanitizeHtml(line);
      
      // Bold text (apply after sanitization, using escaped asterisks)
      let formattedLine = sanitizedLine.replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="font-semibold">$1</strong>'
      );
      
      // List items
      if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
        formattedLine = `<span class="block pl-2">${formattedLine}</span>`;
      }

      return (
        <span
          key={i}
          className="block"
          dangerouslySetInnerHTML={{ __html: formattedLine || "&nbsp;" }}
        />
      );
    });
  };

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform bg-primary text-primary-foreground"
          size="icon"
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-[9998] sm:hidden"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
            aria-hidden="true"
          />
          <Card className="fixed inset-0 sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:w-96 sm:h-[600px] sm:max-h-[600px] shadow-2xl z-[9999] flex flex-col rounded-none sm:rounded-lg bg-background">
          <CardHeader className="flex-shrink-0 border-b flex flex-row items-center justify-between pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6 bg-background min-h-[56px] sm:min-h-auto" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
            <CardTitle className="text-base sm:text-lg pr-2 flex-1 min-w-0 truncate">Chat with Robin</CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChatHistory}
                  className="h-8 w-8 sm:h-8 sm:w-8 flex-shrink-0"
                  title="Clear chat history"
                >
                  <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="h-8 w-8 sm:h-8 sm:w-8 flex-shrink-0"
                aria-label="Close chat"
              >
                <X className="h-4 w-4 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-4 sm:py-8">
                  <MessageCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-xs sm:text-sm px-2">
                    Hi! I'm Robin, your support assistant.
                    <br />
                    How can I help you today?
                  </p>
                  <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                      onClick={() => sendMessage("Show my orders")}
                    >
                      <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">View my orders</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                      onClick={() => sendMessage("What is your return policy?")}
                    >
                      <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">Return policy</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                      onClick={() => sendMessage("Shipping information")}
                    >
                      <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">Shipping info</span>
                    </Button>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className="space-y-1.5 sm:space-y-2">
                  {/* User Message */}
                  {message.role === "user" && (
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 max-w-[85%] sm:max-w-[80%]">
                        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Assistant Message */}
                  {message.role === "assistant" && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 max-w-[90%] sm:max-w-[85%]">
                        {message.content && (
                          <div className="text-xs sm:text-sm break-words">{formatContent(message.content)}</div>
                        )}
                        {renderMessageData(message.data)}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-2">
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="flex justify-start">
                  <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 max-w-[90%] sm:max-w-[80%]">
                    <p className="text-xs sm:text-sm break-words">{errorMessage}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-[10px] sm:text-xs mt-1"
                      onClick={() => setErrorMessage(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 sm:p-4 border-t bg-background" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="flex gap-1.5 sm:gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !inputValue.trim()}
                className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </form>
        </Card>
        </>
      )}
    </>
  );
}
