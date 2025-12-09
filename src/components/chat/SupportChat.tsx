"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CHAT_HISTORY_KEY = "focusrobin_chat_history";
const CHAT_SESSION_KEY = "focusrobin_chat_session_id";

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history from localStorage on mount
  const loadChatHistory = (): any[] => {
    if (typeof window === "undefined") return [];
    
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Validate and clean the messages
          return parsed.filter(msg => 
            msg && 
            msg.role && 
            (msg.content || msg.parts) &&
            (msg.role === "user" || msg.role === "assistant")
          );
        }
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      // Clear corrupted data
      try {
        localStorage.removeItem(CHAT_HISTORY_KEY);
      } catch (clearError) {
        console.error("Error clearing corrupted history:", clearError);
      }
    }
    
    return [];
  };

  // Save chat history to localStorage
  const saveChatHistory = (messages: any[]) => {
    if (typeof window === "undefined") return;
    
    try {
      // Only save messages that are complete (not streaming)
      const messagesToSave = messages
        .filter(msg => {
          // Don't save temporary/streaming messages
          if (msg.id?.startsWith("temp-")) return false;
          // Ensure message has required fields
          return msg.role && (msg.content || msg.parts);
        })
        .map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          parts: msg.parts,
          createdAt: msg.createdAt || new Date().toISOString(),
        }));
      
      if (messagesToSave.length > 0) {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToSave));
      }
      
      // Generate session ID if not exists
      if (!sessionId) {
        const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        localStorage.setItem(CHAT_SESSION_KEY, newSessionId);
      }
    } catch (error) {
      console.error("Error saving chat history:", error);
      // If storage is full, try to clear old messages
      try {
        const currentMessages = messages.slice(-20); // Keep last 20 messages
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(currentMessages));
      } catch (clearError) {
        console.error("Error clearing old messages:", clearError);
      }
    }
  };

  // Load initial messages synchronously before useChat initializes
  const getInitialMessages = (): any[] => {
    if (typeof window === "undefined") return [];
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(msg => 
            msg && 
            msg.role && 
            (msg.content || msg.parts) &&
            (msg.role === "user" || msg.role === "assistant")
          );
        }
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
    return [];
  };

  // Initialize session ID on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSessionId = localStorage.getItem(CHAT_SESSION_KEY);
      if (savedSessionId) {
        setSessionId(savedSessionId);
      } else {
        const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        localStorage.setItem(CHAT_SESSION_KEY, newSessionId);
      }
      setIsInitialized(true);
    }
  }, []);

  const { messages, sendMessage, status, error, reload, setMessages } = useChat({
    api: "/api/chat",
    maxSteps: 5, // Allow multiple tool calls in sequence
    initialMessages: getInitialMessages(),
    onFinish: (message) => {
      // Ensure message is fully processed
      console.log("Message finished:", message);
      // Save history after message is finished
      if (typeof window !== "undefined") {
        setTimeout(() => {
          const currentMessages = messages.length > 0 ? messages : [message];
          saveChatHistory(currentMessages);
        }, 100);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setErrorMessage(error.message || "An error occurred. Please try again.");
    },
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

  // Save chat history whenever messages change (but not while streaming)
  useEffect(() => {
    if (isInitialized && messages.length > 0 && status !== "streaming" && status !== "submitted") {
      // Debounce the save to avoid too frequent writes
      const timeoutId = setTimeout(() => {
        saveChatHistory(messages);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, status, isInitialized]);

  // Ensure messages are restored if they weren't loaded initially
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory && messages.length === 0) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const validMessages = parsed.filter(msg => 
              msg && 
              msg.role && 
              (msg.content || msg.parts) &&
              (msg.role === "user" || msg.role === "assistant")
            );
            if (validMessages.length > 0) {
              setMessages(validMessages);
            }
          }
        } catch (error) {
          console.error("Error restoring messages:", error);
        }
      }
    }
  }, [isInitialized, setMessages]);

  // Clear chat history function
  const clearChatHistory = () => {
    if (typeof window !== "undefined" && confirm("Are you sure you want to clear your chat history?")) {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      setMessages([]);
      // Generate new session ID
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      localStorage.setItem(CHAT_SESSION_KEY, newSessionId);
    }
  };

  // Debug: Log message updates to track response timing
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        const textContent = getMessageText(lastMessage);
        const toolParts = getToolParts(lastMessage);
        console.log("Assistant message updated:", {
          id: lastMessage.id,
          hasText: !!textContent,
          toolCount: toolParts.length,
          status,
          messageStructure: {
            hasParts: !!lastMessage.parts,
            hasContent: !!lastMessage.content,
            partsLength: lastMessage.parts?.length || 0,
            contentType: typeof lastMessage.content,
          },
        });
      }
    }
  }, [messages, status]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent sending if already loading or if input is empty
    if (!inputValue.trim() || isLoading || status === "streaming" || status === "submitted") {
      return;
    }

    const message = inputValue.trim();
    setInputValue("");
    setErrorMessage(null);

    try {
      // Send message - this will trigger streaming response
      // The useChat hook will handle the response and update messages
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

  // Extract text content from message parts or content
  const getMessageText = (message: any): string => {
    // Handle parts array structure
    if (message.parts && Array.isArray(message.parts)) {
      const textParts = message.parts
        .filter((part: any) => part.type === "text")
        .map((part: any) => part.text || "")
        .join("");
      if (textParts) return textParts;
    }
    
    // Handle direct content string
    if (typeof message.content === "string") {
      return message.content;
    }
    
    // Handle content array structure
    if (Array.isArray(message.content)) {
      return message.content
        .filter((part: any) => part.type === "text" || typeof part === "string")
        .map((part: any) => (typeof part === "string" ? part : part.text || ""))
        .join("");
    }
    
    return "";
  };

  // Get tool invocations from message parts or content
  const getToolParts = (message: any): any[] => {
    const toolParts: any[] = [];
    
    // Handle parts array structure
    if (message.parts && Array.isArray(message.parts)) {
      const parts = message.parts.filter((part: any) => part.type === "tool");
      toolParts.push(...parts);
    }
    
    // Handle content array structure
    if (Array.isArray(message.content)) {
      const contentParts = message.content.filter((part: any) => part.type === "tool");
      toolParts.push(...contentParts);
    }
    
    // Handle toolCalls if present
    if (message.toolCalls && Array.isArray(message.toolCalls)) {
      toolParts.push(...message.toolCalls);
    }
    
    // Handle toolInvocations if present
    if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
      toolParts.push(...message.toolInvocations);
    }
    
    return toolParts;
  };

  const renderToolResult = (toolPart: any) => {
    // Extract tool name from various possible locations
    const toolName = toolPart.toolName || toolPart.toolCallName || toolPart.name;
    
    // Extract result from various possible locations
    const result = toolPart.output || toolPart.result || toolPart.content || toolPart;

    // Show loading state immediately when tool is being called
    if (!result || (typeof result === "object" && Object.keys(result).length === 0)) {
      if (toolPart.state === "input-streaming" || toolPart.state === "input-available" || toolPart.state === "call" || toolPart.state === "partial-call") {
        return (
          <div className="text-sm text-muted-foreground p-2 bg-muted rounded animate-pulse">
            {toolName === "lookupOrders" && "Looking up your orders..."}
            {toolName === "checkOrderStatus" && "Checking order status..."}
            {toolName === "checkRefundEligibility" && "Checking refund eligibility..."}
            {toolName === "getPolicyInfo" && "Fetching policy information..."}
            {!toolName && "Processing..."}
          </div>
        );
      }
      // Show tool invocation even if no result yet
      if (toolPart.toolCallId || toolPart.toolInvocationId || toolPart.id) {
        return (
          <div className="text-sm text-muted-foreground p-2 bg-muted rounded animate-pulse">
            Processing {toolName || "request"}...
          </div>
        );
      }
      return null;
    }

    if (toolName === "lookupOrders") {
      // Handle error case
      if (result?.error || (typeof result === "object" && "error" in result)) {
        return (
          <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
            {result.error || "An error occurred while looking up your orders."}
          </div>
        );
      }

      // Handle orders array
      if (result?.orders && Array.isArray(result.orders) && result.orders.length > 0) {
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

      // Check if result is an array of orders directly (edge case)
      if (Array.isArray(result) && result.length > 0) {
        return (
          <div className="space-y-2">
            <p className="text-sm font-semibold mb-2">
              Your Recent Orders ({result.length}):
            </p>
            {result.map((order: any, idx: number) => (
              <Card key={order.id || idx} className="p-3 bg-muted/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm">{order.orderNumber || order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  {order.status && (
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
                  )}
                </div>
                {(order.items || order.total) && (
                  <div className="text-sm">
                    {order.items && (
                      <p className="font-medium">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    )}
                    {order.total && (
                      <p className="text-muted-foreground">
                        Total: {order.currency || "$"} {parseFloat(order.total).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
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

    // Default display - show raw result for debugging
    console.warn("Unknown tool result structure:", { toolName, toolPart, result });
    return (
      <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
        <p className="font-semibold mb-1">{toolName || "Tool Result"}:</p>
        <pre className="text-xs overflow-auto max-h-40">
          {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
        </pre>
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
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChatHistory}
                  className="h-8 w-8"
                  title="Clear chat history"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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
                const textContent = getMessageText(message);
                const toolParts = getToolParts(message);

                return (
                  <div key={message.id} className="space-y-2">
                    {/* User Message */}
                    {message.role === "user" && (
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                          <p className="text-sm whitespace-pre-wrap">{textContent || message.content || ""}</p>
                        </div>
                      </div>
                    )}

                    {/* Assistant Message */}
                    {message.role === "assistant" && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                          {/* Show text content immediately, even if streaming */}
                          {textContent && (
                            <p className="text-sm whitespace-pre-wrap">{textContent}</p>
                          )}
                          {/* Render tool results - show immediately when tools are called */}
                          {toolParts.length > 0 && (
                            <div className={textContent ? "mt-2" : ""}>
                              {toolParts.map((toolPart: any, idx: number) => (
                                <div key={`${toolPart.toolCallId || toolPart.toolName || toolPart.toolInvocationId || idx}-${idx}`} className={idx > 0 ? "mt-2" : ""}>
                                  {renderToolResult(toolPart)}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Show loading indicator if message is being processed */}
                          {!textContent && toolParts.length === 0 && isLoading && message.id === messages[messages.length - 1]?.id && (
                            <div className="text-sm text-muted-foreground animate-pulse">
                              Thinking...
                            </div>
                          )}
                          {/* Show empty state if no content and no tools */}
                          {!textContent && toolParts.length === 0 && !isLoading && (
                            <div className="text-sm text-muted-foreground italic">
                              Processing...
                            </div>
                          )}
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
              disabled={isLoading || status === "streaming" || status === "submitted"}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isLoading || status === "streaming" || status === "submitted" || !inputValue.trim()} 
              size="icon"
            >
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
