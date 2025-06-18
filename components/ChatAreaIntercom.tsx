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
  author?: {
    type: string;
    id: string;
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

  // Get user ID from localStorage on initial load
  useEffect(() => {
    // Get user ID from localStorage
    const savedUserId = localStorage.getItem('intercom_user_id');
    if (savedUserId) {
      setUserId(savedUserId);
      console.log("ChatArea: Using user ID:", savedUserId);
    } else {
      console.warn("No user ID found in localStorage");
    }
  }, []);

  // Load existing conversation if conversationId is available
  useEffect(() => {
    const loadConversation = async () => {
      if (conversationId) {
        try {
          setIsLoading(true);
          // TODO: Load conversation from Intercom API
        } catch (error) {
          console.error("Error loading conversation:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadConversation();
  }, [conversationId]);

  // Handle form submission
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement> | string,
  ) => {
    if (typeof event !== "string") {
      event.preventDefault();
    }

    setShowAvatar(true);
    setIsLoading(true);

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: typeof event === "string" ? event : input,
      userId: userId
    };
    setInput("");

    try {
      // Handled by POST request handler on app/api/intercom/conversations/route.ts
      const response = await fetch("/api/intercom/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationId: conversationId
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error("Error replying:", error);

      // Add error message to stream
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: crypto.randomUUID(),
          role: "bot",
          content: "Sorry, there was an error. Please try again later."
        }
      ]);
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
                      ? `Conversation #${conversationId}`
                      : "New conversation"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

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
                    Describe your issue in detail and we'll connect you with the right person.
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
                      ["user", "conversation"].includes(message.author?.type || "") ? "justify-end" : "justify-start"
                    } ${
                      index === messages.length - 1 ? "animate-fade-in-up" : ""
                    }`}
                    style={{
                      animationDuration: "300ms",
                      animationFillMode: "backwards",
                    }}
                  >
                    {/* Avatar on the left for non-user messages */}
                    {["bot", "admin"].includes(message.author?.type || "") && (
                      <Avatar className="w-8 h-8 mr-2 border">
                        <AvatarFallback>
                          {message.author?.type.substring(0,1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`p-3 rounded-md text-sm max-w-[65%] ${
                        message.author?.type === "user"
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
                    {["user"].includes(message.author?.type || "") && (
                      <Avatar className="w-8 h-8 ml-2 border bg-primary/10">
                        <AvatarFallback className="text-primary font-medium">
                          U
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
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
          <div className="flex justify-end items-center p-3">
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