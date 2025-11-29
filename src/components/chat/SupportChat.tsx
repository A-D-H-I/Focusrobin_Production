"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat",
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Handle error display
  useEffect(() => {
    if (error) {
      const errorMsg = error.message || "";
      if (errorMsg.includes("API") || errorMsg.includes("configured") || errorMsg.includes("503")) {
        setErrorMessage("AI chatbot is not configured. Please add your Google API key.");
      } else {
        setErrorMessage(errorMsg || "Failed to connect to chat. Please try again later.");
      }
    }
  }, [error]);

  // Clear error when status changes to ready
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      setErrorMessage(null);
    }
  }, [status, messages.length]);

  // Clear error when user starts typing
  useEffect(() => {
    if (inputValue && errorMessage) {
      setErrorMessage(null);
    }
  }, [inputValue, errorMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, status]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue("");
    setErrorMessage(null);

    try {
      await sendMessage({ text: message });
    } catch (err: any) {
      console.error("Chat error:", err);
      // Check if the error message contains API configuration info
      const errorMsg = err.message || "";
      if (errorMsg.includes("API") || errorMsg.includes("configured") || errorMsg.includes("GOOGLE")) {
        setErrorMessage("AI chatbot is not configured. Please contact support or try again later.");
      } else {
        setErrorMessage(errorMsg || "Failed to send message. Please try again.");
      }
    }
  };

  // Extract text content from message parts
  const getMessageText = (parts: any[]): string => {
    if (!parts || !Array.isArray(parts)) return "";
    return parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text || "")
      .join("");
  };

  // Get tool invocations from message parts
  const getToolParts = (parts: any[]): any[] => {
    if (!parts || !Array.isArray(parts)) return [];
    return parts.filter((part: any) => part.type === "tool");
  };

  const renderToolResult = (toolPart: any) => {
    const toolName = toolPart.toolName;
    const result = toolPart.output;

    if (!result) {
      if (toolPart.state === "input-streaming" || toolPart.state === "input-available") {
        return (
          <div className="text-sm text-muted-foreground p-2 bg-muted rounded animate-pulse">
            Processing...
          </div>
        );
      }
      return null;
    }

    if (toolName === "lookupOrders") {
      if (result?.error) {
        return (
          <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
            {result.error}
          </div>
        );
      }

      if (result?.orders && result.orders.length > 0) {
        return (
          <div className="space-y-2">
            <p className="text-sm font-semibold mb-2">
              Your Recent Orders ({result.orders.length}):
            </p>
            {result.orders.map((order: any) => (
              <Card key={order.id} className="p-3 bg-muted/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded",
                      order.status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : order.status === "SHIPPED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-muted-foreground">
                    Total: {order.currency} {parseFloat(order.total).toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        );
      }

      return (
        <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
          No orders found.
        </div>
      );
    }

    if (toolName === "checkOrderStatus") {
      if (result?.error) {
        return (
          <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
            {result.error}
          </div>
        );
      }

      if (result) {
        return (
          <Card className="p-3 bg-muted/50">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <p className="font-semibold text-sm">{result.orderNumber}</p>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    result.status === "DELIVERED"
                      ? "bg-green-100 text-green-800"
                      : result.status === "SHIPPED"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  )}
                >
                  {result.status}
                </span>
              </div>
              {result.trackingNumber && (
                <div className="text-sm">
                  <p className="font-medium">Tracking: {result.trackingNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {result.shippingProvider}
                  </p>
                </div>
              )}
              {result.trackingMessage && (
                <p className="text-xs text-muted-foreground italic">
                  {result.trackingMessage}
                </p>
              )}
            </div>
          </Card>
        );
      }
    }

    if (toolName === "checkRefundEligibility") {
      if (result?.error) {
        return (
          <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
            {result.error}
          </div>
        );
      }

      if (result) {
        return (
          <Card
            className={cn(
              "p-3",
              result.isEligible
                ? "bg-green-50 border-green-200"
                : "bg-yellow-50 border-yellow-200"
            )}
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                {result.isEligible ? "✓ Eligible for Refund" : "Not Eligible"}
              </p>
              <p className="text-xs text-muted-foreground">{result.reason}</p>
              <p className="text-xs text-muted-foreground">
                Order: {result.orderNumber} • {result.daysSinceOrder} days since order
              </p>
            </div>
          </Card>
        );
      }
    }

    if (toolName === "getPolicyInfo") {
      if (result?.title) {
        return (
          <Card className="p-3 bg-muted/50">
            <p className="font-semibold text-sm mb-1">{result.title}</p>
            <p className="text-xs text-muted-foreground">{result.description}</p>
          </Card>
        );
      }
      if (result?.policies) {
        return (
          <div className="space-y-2">
            {result.policies.map((policy: any, idx: number) => (
              <Card key={idx} className="p-3 bg-muted/50">
                <p className="font-semibold text-sm mb-1">{policy.title}</p>
                <p className="text-xs text-muted-foreground">{policy.description}</p>
              </Card>
            ))}
          </div>
        );
      }
    }

    // Default display
    return (
      <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
        {toolName}: {JSON.stringify(result)}
      </div>
    );
  };

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="flex-shrink-0 border-b flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Chat with Robin</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Hi! I'm Robin, your support assistant.
                    <br />
                    How can I help you today?
                  </p>
                </div>
              )}

              {messages.map((message) => {
                const textContent = getMessageText(message.parts);
                const toolParts = getToolParts(message.parts);

                return (
                  <div key={message.id} className="space-y-2">
                    {/* User Message */}
                    {message.role === "user" && (
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                          <p className="text-sm whitespace-pre-wrap">{textContent}</p>
                        </div>
                      </div>
                    )}

                    {/* Assistant Message */}
                    {message.role === "assistant" && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                          {textContent && (
                            <p className="text-sm whitespace-pre-wrap">{textContent}</p>
                          )}
                          {/* Render tool results */}
                          {toolParts.map((toolPart: any, idx: number) => (
                            <div key={idx} className="mt-2">
                              {renderToolResult(toolPart)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="flex justify-start">
                  <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 max-w-[90%]">
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form
            onSubmit={handleSubmit}
            className="flex-shrink-0 border-t p-4 flex gap-2"
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}
