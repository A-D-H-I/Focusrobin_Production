"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getAdminChats,
  getAdminChatMessages,
  sendAdminReply,
  updateChatStatus,
  blockUser,
  unblockUser,
  checkUserBlockStatus,
} from "@/app/actions/chat";
import { MessageCircle, Send, User, Bot, X, CheckCircle, Ban, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Chat {
  id: string;
  userEmail: string;
  userName: string;
  status: string;
  lastMessageAt: Date;
  createdAt: Date;
  lastMessage: {
    text: string;
    sender: string;
    timestamp: Date;
  } | null;
}

interface Message {
  id: string;
  text: string;
  originalText?: string;
  sender: "user" | "admin";
  timestamp: Date;
  language?: string;
}

interface ChatManagementProps {
  initialChats: Chat[];
}

// Fetcher function for SWR
const fetcher = async () => {
  const result = await getAdminChats();
  if (result.success && result.chats) {
    return result.chats;
  }
  throw new Error(result.error || "Failed to load chats");
};

// Fetcher function for chat messages
const messagesFetcher = async (chatId: string) => {
  const result = await getAdminChatMessages(chatId);
  if (result.success && result.messages && result.chat) {
    return {
      messages: result.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
      chat: {
        ...result.chat,
        forceClosed: result.chat.forceClosed || false,
      },
    };
  }
  throw new Error(result.error || "Failed to load messages");
};

export default function ChatManagement({ initialChats }: ChatManagementProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatInfo, setChatInfo] = useState<{
    id: string;
    userEmail: string;
    userName: string;
    userLanguage: string;
    status: string;
    forceClosed?: boolean;
  } | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockDuration, setBlockDuration] = useState<number>(24);
  const [blockReason, setBlockReason] = useState<string>("");
  const [isBlocking, setIsBlocking] = useState(false);
  const [userBlockStatus, setUserBlockStatus] = useState<{
    blocked: boolean;
    blockedUntil?: Date;
    reason?: string;
  } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use SWR for fetching chats with automatic polling
  const { data: chats = initialChats, mutate: mutateChats } = useSWR<Chat[]>(
    "admin-chats",
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      fallbackData: initialChats, // Use initialChats as fallback
      revalidateOnFocus: true, // Revalidate when window gains focus
      revalidateOnReconnect: true, // Revalidate when network reconnects
    }
  );

  // Use SWR for fetching messages when a chat is selected
  const {
    data: messagesData,
    mutate: mutateMessages,
    isLoading: isLoadingMessages,
  } = useSWR(
    selectedChatId ? `admin-chat-messages-${selectedChatId}` : null,
    selectedChatId ? () => messagesFetcher(selectedChatId) : null,
    {
      refreshInterval: selectedChatId ? 5000 : 0, // Poll every 5 seconds when chat is selected
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const messages = messagesData?.messages || [];
  const isLoading = isLoadingMessages;

  // Update chatInfo when messages data changes
  useEffect(() => {
    if (messagesData?.chat) {
      setChatInfo({
        ...messagesData.chat,
        forceClosed: messagesData.chat.forceClosed || false,
      });
      // Check block status after loading chat info
      if (messagesData.chat.userEmail) {
        checkUserBlockStatus(undefined, messagesData.chat.userEmail).then((blockResult) => {
          if (blockResult.success) {
            setUserBlockStatus({
              blocked: blockResult.blocked,
              blockedUntil: blockResult.blockedUntil ? new Date(blockResult.blockedUntil) : undefined,
              reason: blockResult.reason,
            });
          }
        });
      }
    }
  }, [messagesData]);

  // Auto-scroll only when messages length increases (new message)
  const prevMessagesLengthRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkBlockStatus = useCallback(async () => {
    if (!chatInfo) return;
    // Extract userId from chat if available
    const result = await checkUserBlockStatus(undefined, chatInfo.userEmail);
    if (result.success) {
      setUserBlockStatus({
        blocked: result.blocked,
        blockedUntil: result.blockedUntil ? new Date(result.blockedUntil) : undefined,
        reason: result.reason,
      });
    }
  }, [chatInfo]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedChatId || isSending) return;

    const messageText = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    // Optimistically add admin message using SWR optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: "admin",
      timestamp: new Date(),
    };

    // Store current messages for rollback
    const currentMessagesData = messagesData;

    // Optimistic update: add temp message to current messages
    mutateMessages(
      (current) => {
        if (!current) {
          // If no current data, create a minimal structure
          return {
            messages: [tempMessage],
            chat: chatInfo || {
              id: selectedChatId!,
              userEmail: "",
              userName: "",
              userLanguage: "en",
              status: "OPEN",
            },
          };
        }
        return {
          ...current,
          messages: [...current.messages, tempMessage],
        };
      },
      false // Don't revalidate yet
    );

    try {
      const result = await sendAdminReply(selectedChatId, messageText);

      if (result.success) {
        // Reload messages and chats using SWR mutate
        await mutateMessages(); // Revalidate to get real message from server
        await mutateChats();
      } else {
        // Remove optimistic message on error by reverting to previous data
        mutateMessages(currentMessagesData, false); // Revert to previous state
        alert(result.error || "Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      // Remove optimistic message on error by reverting to previous data
      mutateMessages(currentMessagesData, false); // Revert to previous state
      alert("Failed to send reply. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseChat = async () => {
    if (!selectedChatId) return;

    const result = await updateChatStatus(selectedChatId, "CLOSED");
    if (result.success) {
      await mutateChats();
      if (chatInfo) {
        setChatInfo({ ...chatInfo, status: "CLOSED" });
      }
    }
  };

  const handleForceClose = async () => {
    if (!selectedChatId) return;
    if (!confirm("Are you sure you want to permanently close this chat? The user will not be able to send messages to this chat again.")) {
      return;
    }

    const result = await updateChatStatus(selectedChatId, "FORCE_CLOSED");
    if (result.success) {
      await mutateChats();
      await mutateMessages();
      if (chatInfo) {
        setChatInfo({ ...chatInfo, status: "FORCE_CLOSED", forceClosed: true });
      }
    }
  };

  const handleBlockUser = async () => {
    if (!chatInfo) return;

    if (!chatInfo.userEmail) {
      alert("Cannot block user: Email not available");
      return;
    }

    setIsBlocking(true);
    try {
      const result = await blockUser(
        undefined, // userId - would need to get from chat if available
        chatInfo.userEmail,
        blockDuration,
        blockReason || undefined
      );

      if (result.success) {
        setShowBlockDialog(false);
        setBlockDuration(24);
        setBlockReason("");
        await checkBlockStatus();
        await mutateChats();
        const untilDate = result.blockedUntil 
          ? new Date(result.blockedUntil).toLocaleString()
          : "indefinitely";
        alert(`User blocked until ${untilDate}`);
      } else {
        console.error("Block user error:", result.error);
        alert(result.error || "Failed to block user");
      }
    } catch (error: any) {
      console.error("Error blocking user:", error);
      const errorMessage = error?.message || "Failed to block user. Please try again.";
      alert(errorMessage);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!chatInfo) return;
    if (!confirm("Are you sure you want to unblock this user?")) {
      return;
    }

    try {
      const result = await unblockUser(undefined, chatInfo.userEmail);
      if (result.success) {
        await checkBlockStatus();
        await mutateChats();
        alert("User unblocked successfully");
      } else {
        alert(result.error || "Failed to unblock user");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Failed to unblock user. Please try again.");
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-brand-h1 font-headline text-foreground">Chat Management</h1>
            <p className="mt-2 text-muted-foreground">
              View and reply to customer messages
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {/* Chat List */}
          <Card className="lg:col-span-1 flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <CardHeader className="flex-shrink-0">
              <CardTitle>Chats</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
              {chats.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No chats yet
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-muted transition-colors border-b",
                        selectedChatId === chat.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-sm">
                            {chat.userName}
                          </span>
                        </div>
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
                      <p className="text-xs text-muted-foreground mb-1">
                        {chat.userEmail}
                      </p>
                      {chat.lastMessage && (
                        <p className="text-sm text-foreground line-clamp-2">
                          {chat.lastMessage.text}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(chat.lastMessageAt)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="lg:col-span-2 flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {selectedChatId && chatInfo ? (
              <>
                <CardHeader className="border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{chatInfo.userName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {chatInfo.userEmail} • Language: {chatInfo.userLanguage.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          chatInfo.status === "OPEN"
                            ? "default"
                            : chatInfo.status === "CLOSED"
                            ? "secondary"
                            : chatInfo.status === "FORCE_CLOSED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {chatInfo.status === "FORCE_CLOSED" ? "FORCE CLOSED" : chatInfo.status}
                      </Badge>
                      {userBlockStatus?.blocked && (
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />
                          Blocked until {userBlockStatus.blockedUntil?.toLocaleString()}
                        </Badge>
                      )}
                      {chatInfo.status === "OPEN" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCloseChat}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Close Chat
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleForceClose}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Force Close
                          </Button>
                        </>
                      )}
                      {!userBlockStatus?.blocked ? (
                        <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Ban className="h-4 w-4 mr-2" />
                              Block User
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Block User</DialogTitle>
                              <DialogDescription>
                                Block {chatInfo.userEmail} from sending messages for a specified duration.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="block-duration">Block Duration (Hours)</Label>
                                <Input
                                  id="block-duration"
                                  type="number"
                                  min="1"
                                  value={blockDuration}
                                  onChange={(e) => setBlockDuration(parseInt(e.target.value) || 24)}
                                  placeholder="24"
                                />
                              </div>
                              <div>
                                <Label htmlFor="block-reason">Reason (Optional)</Label>
                                <Input
                                  id="block-reason"
                                  value={blockReason}
                                  onChange={(e) => setBlockReason(e.target.value)}
                                  placeholder="e.g., Spam, Harassment, etc."
                                />
                              </div>
                              <Button
                                onClick={handleBlockUser}
                                disabled={isBlocking}
                                className="w-full"
                                variant="destructive"
                              >
                                {isBlocking ? "Blocking..." : "Block User"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUnblockUser}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Unblock User
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 bg-muted/30 space-y-4 min-h-0">
                    {isLoading ? (
                      <div className="text-center text-muted-foreground py-8">
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            message.sender === "admin"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          {message.sender === "user" && (
                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-4 py-3",
                              message.sender === "admin"
                                ? "bg-primary text-primary-foreground"
                                : "bg-background border text-foreground"
                            )}
                          >
                            <p className="text-sm leading-relaxed">
                              {message.text}
                            </p>
                            {message.originalText &&
                              message.originalText !== message.text && (
                                <p className="text-xs mt-2 opacity-70 italic">
                                  Original: {message.originalText}
                                </p>
                              )}
                            <p
                              className={cn(
                                "text-xs mt-2",
                                message.sender === "admin"
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                          {message.sender === "admin" && (
                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="border-t p-4 bg-background flex-shrink-0">
                    {chatInfo.forceClosed ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-sm font-semibold text-red-800 mb-2">
                          This chat has been force closed
                        </p>
                        <p className="text-xs text-red-600">
                          You cannot send replies to force-closed chats. The user cannot send messages to this chat.
                        </p>
                      </div>
                    ) : (
                      <>
                        <form onSubmit={handleSendReply} className="flex gap-2">
                          <Input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your reply..."
                            className="flex-1"
                            disabled={isSending || chatInfo.status === "CLOSED" || userBlockStatus?.blocked}
                          />
                          <Button
                            type="submit"
                            disabled={
                              !inputValue.trim() ||
                              isSending ||
                              chatInfo.status === "CLOSED" ||
                              userBlockStatus?.blocked
                            }
                            className="disabled:opacity-50"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </Button>
                        </form>
                        <p className="text-xs text-muted-foreground mt-2">
                          {chatInfo.userLanguage !== "en" ? (
                            <>
                              User's language: {chatInfo.userLanguage.toUpperCase()}.{" "}
                              Your reply will be automatically translated (if translation API is configured).
                            </>
                          ) : (
                            "User is communicating in English."
                          )}
                          {userBlockStatus?.blocked && (
                            <span className="block text-red-600 mt-1">
                              User is blocked until {userBlockStatus.blockedUntil?.toLocaleString()}
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a chat to view messages</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

