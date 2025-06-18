"use client";

import React, { useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import ChatAreaIntercom from "@/components/ChatAreaIntercom";

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-screen w-full">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden h-screen w-full">
        <ChatAreaIntercom conversationId={currentConversationId} setConversationId={setCurrentConversationId} />
      </div>
    </div>
  );
}