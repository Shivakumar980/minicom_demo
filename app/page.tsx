// app/page.tsx - Enhanced with conversation management
"use client";

import React, { useState, useEffect } from "react";
import TopNavBar from "@/components/TopNavBar";
import ChatAreaIntercom from "@/components/ChatAreaIntercom";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, MessageSquare } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp?: number;
  userEmail: string;
}

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("");

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('intercom_conversations');
    if (savedConversations) {
      try {
        setConversations(JSON.parse(savedConversations));
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }

    // Load current user
    const savedUserId = localStorage.getItem('intercom_user_id');
    if (savedUserId) {
      setCurrentUser(savedUserId);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('intercom_conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Handle new conversation creation
  const handleNewConversation = () => {
    setCurrentConversationId(null);
  };

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  // Handle conversation creation (called from ChatArea when a new conversation is created)
  const handleConversationCreated = (conversationId: string, firstMessage?: string) => {
    const newConversation: Conversation = {
      id: conversationId,
      title: firstMessage ? firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '') : 'New Conversation',
      lastMessage: firstMessage,
      timestamp: Date.now(),
      userEmail: currentUser,
    };

    setConversations(prev => {
      // Check if conversation already exists
      const existing = prev.find(conv => conv.id === conversationId);
      if (existing) {
        return prev;
      }
      return [newConversation, ...prev];
    });
  };

  // Filter conversations for current user
  const userConversations = conversations.filter(conv => conv.userEmail === currentUser);

  return (
    <div className="flex flex-col h-screen w-full">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for conversations */}
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <Button 
              onClick={handleNewConversation}
              className="w-full gap-2"
              variant={currentConversationId ? "outline" : "default"}
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Conversation
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {userConversations.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new conversation to see it here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {userConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentConversationId === conversation.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium text-sm truncate">
                      {conversation.title}
                    </div>
                    {conversation.lastMessage && (
                      <div className="text-xs opacity-70 truncate mt-1">
                        {conversation.lastMessage}
                      </div>
                    )}
                    {conversation.timestamp && (
                      <div className="text-xs opacity-50 mt-1">
                        {new Date(conversation.timestamp).toLocaleDateString()}
                      </div>
                    )}
                    <div className="text-xs opacity-50 mt-1">
                      ID: {conversation.id.slice(-8)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t text-xs text-muted-foreground">
            <div>User: {currentUser}</div>
            <div>{userConversations.length} conversation(s)</div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex">
          <ChatAreaIntercom 
            conversationId={currentConversationId} 
            setConversationId={(id) => {
              setCurrentConversationId(id);
              // This will be called when a new conversation is created
              // We'll enhance the ChatArea component to also call handleConversationCreated
            }}
          />
        </div>
      </div>
    </div>
  );
}