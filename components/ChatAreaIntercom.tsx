// components/ChatAreaIntercom.tsx - Updated with full Intercom integration
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import {
  HandHelping,
  WandSparkles,
  BookOpenText,
  Send,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp?: number;
  userId?: string;
  author?: {
    type: string;
    id: string;
    name?: string;
    email?: string;
  };
}

interface ChatAreaIntercomProps {
  conversationId: string | null;
  setConversationId: (id: string) => void;
}

// MessageContent component to display chat messages
const MessageContent = ({
  content,
}: {
  content: string;
}) => {
  return (
    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
      {content}
    </ReactMarkdown>
  );
};

function ChatAreaIntercom({ conversationId, setConversationId }: ChatAreaIntercomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Get user ID from localStorage on initial load
  useEffect(() => {
    // Get user ID from localStorage
    const savedUserId = localStorage.getItem('intercom_user_id');
    if (savedUserId) {
      setUserId(savedUserId);
      console.log("ChatArea: Using user ID:", savedUserId);
    } else {
      console.warn("No user ID found in localStorage");
      // Set a default user for demo purposes
      const defaultUser = "user-1@example.com";
      localStorage.setItem('intercom_user_id', defaultUser);
      setUserId(defaultUser);
    }
  }, []);

  // Load existing conversation if conversationId is available
  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId && userId) {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await fetch(`/api/intercom/conversations?conversationId=${conversationId}`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" },
          });

          if (!response.ok) {
            throw new Error(`Failed to load conversation: ${response.status}`);
          }

          const data = await response.json();
          if (data.messages) {
            setMessages(data.messages);
            setShowAvatar(true);
            console.log("Loaded conversation with", data.messages.length, "messages");
          }
        } catch (error) {
          console.error("Error loading conversation:", error);
          setError(`Failed to load conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Don't set loading to false immediately, allow user to try again
          setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadConversation();
  }, [conversationId, userId]);

  // Handle form submission
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement> | string,
  ) => {
    if (typeof event !== "string") {
      event.preventDefault();
    }

    const messageContent = typeof event === "string" ? event : input;
    
    if (!messageContent.trim()) {
      return;
    }

    if (!userId) {
      setError("User not configured. Please refresh the page.");
      return;
    }

    setShowAvatar(true);
    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageContent,
      userId: userId,
      timestamp: Math.floor(Date.now() / 1000),
      author: {
        type: "user",
        id: userId,
        email: userId,
      }
    };

    // Optimistically add the user message
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      // Send message to Intercom API
      const response = await fetch("/api/intercom/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          conversationId: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update messages with the response from Intercom
      if (data.messages) {
        setMessages(data.messages);
      }

      // Update conversation ID if this was a new conversation
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        console.log("New conversation created:", data.conversationId);
      }

      console.log("Message sent successfully");

    } catch (error) {
      console.error("Error sending message:", error);
      setError(error instanceof Error ? error.message : "Failed to send message");
      
      // Keep the optimistic message but add an error indicator
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "bot",
        content: "⚠️ Message sent to Intercom but failed to update conversation. Please refresh to see latest messages.",
        timestamp: Math.floor(Date.now() / 1000),
        userId: "system"
      };
      
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() !== "") {
        handleSubmit(e as any);
      }
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    setInput(textarea.value);

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
  };

  // Helper function to determine if message is from user
  const isUserMessage = (message: Message) => {
    return message.role === "user" || message.author?.type === "user";
  };

  return (
    <Card className="flex-1 flex flex-col mb-4 mr-4 ml-4">
      <CardContent className="flex-1 flex flex-col overflow-hidden pt-4 px-4 pb-0">
        <div className="p-0 flex items-center justify-between pb-2 animate-fade-in">
          <div className="flex items-center space-x-4 mb-2 sm:mb-0">
            {showAvatar && (
              <>
                <Avatar className="w-10 h-10 border">
                  <AvatarImage
                    src="/minicom-logo.svg"
                    alt="Support Agent Avatar"
                    width={40}
                    height={40}
                  />
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-medium leading-none">Support</h3>
                  <p className="text-sm text-muted-foreground">
                    {conversationId
                      ? `Conversation #${conversationId.slice(-8)}`
                      : "New conversation"}
                  </p>
                  {userId && (
                    <p className="text-xs text-muted-foreground">
                      User: {userId}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex justify-between items-center">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setError(null);
                if (conversationId) {
                  // Retry loading the conversation
                  const loadConversation = async () => {
                    try {
                      setIsLoading(true);
                      const response = await fetch(`/api/intercom/conversations?conversationId=${conversationId}`);
                      if (response.ok) {
                        const data = await response.json();
                        if (data.messages) {
                          setMessages(data.messages);
                        }
                      }
                    } catch (retryError) {
                      console.error("Retry failed:", retryError);
                    } finally {
                      setIsLoading(false);
                    }
                  };
                  loadConversation();
                }
              }}
            >
              Retry
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in-up">
              <Avatar className="w-10 h-10 mb-4 border">
                <AvatarImage
                  src="/minicom-logo.svg"
                  alt="Support Avatar"
                  width={40}
                  height={40}
                />
              </Avatar>
              <h2 className="text-2xl font-semibold mb-8">
                Minicom Support
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <HandHelping className="text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Need help? Our support team is ready to assist you.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <WandSparkles className="text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Messages will be sent directly to your Intercom inbox.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpenText className="text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Your conversation history will be saved for future reference.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message.id}>
                  <div
                    className={`flex items-start ${
                      isUserMessage(message) ? "justify-end" : "justify-start"
                    } ${
                      index === messages.length - 1 ? "animate-fade-in-up" : ""
                    }`}
                    style={{
                      animationDuration: "300ms",
                      animationFillMode: "backwards",
                    }}
                  >
                    {/* Avatar on the left for non-user messages */}
                    {!isUserMessage(message) && (
                      <Avatar className="w-8 h-8 mr-2 border">
                        <AvatarImage
                          src="/minicom-logo.svg"
                          alt="Support Avatar"
                          width={32}
                          height={32}
                        />
                        <AvatarFallback>
                          {message.author?.type?.substring(0,1).toUpperCase() || 'S'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`p-3 rounded-md text-sm max-w-[65%] ${
                        isUserMessage(message)
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted border rounded-tl-none"
                      }`}
                    >
                      <MessageContent
                        content={message.content}
                      />
                      {message.timestamp && (
                        <div className="text-xs opacity-70 mt-1 text-right">
                          {new Date(message.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      )}
                    </div>
                    {/* Avatar on the right for user messages */}
                    {isUserMessage(message) && (
                      <Avatar className="w-8 h-8 ml-2 border bg-primary/10">
                        <AvatarFallback className="text-primary font-medium">
                          {message.author?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <Avatar className="w-8 h-8 mr-2 border">
                    <AvatarImage
                      src="/minicom-logo.svg"
                      alt="Support Avatar"
                      width={32}
                      height={32}
                    />
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted border rounded-md p-3 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full relative bg-background border rounded-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        >
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            disabled={isLoading}
            className="resize-none min-h-[44px] bg-background border-0 p-3 rounded-xl shadow-none focus-visible:ring-0"
            rows={1}
          />
          <div className="flex justify-between items-center p-3">
            <div className="text-xs text-muted-foreground">
              {conversationId ? `Conv: ${conversationId.slice(-8)}` : 'New conversation'}
            </div>
            <Button
              type="submit"
              disabled={isLoading || input.trim() === ""}
              className="gap-2"
              size="sm"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full" />
              ) : (
                <>
                  Send Message
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}

export default ChatAreaIntercom;