// app/api/intercom/conversations/route.ts - Complete implementation
import { NextRequest, NextResponse } from 'next/server';
import { 
  createOrFindUser, 
  createConversation, 
  replyToConversation, 
  getConversation,
  IntercomConversation 
} from '@/app/lib/users';

const INTERCOM_ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN;

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp?: number;
  userId: string;
  author?: {
    type: string;
    id: string;
    name?: string;
    email?: string;
  };
}

interface ConversationRequest {
  messages: Message[];
  conversationId?: string;
}

// Convert Intercom conversation to our message format
function convertIntercomToMessages(conversation: IntercomConversation): Message[] {
  const messages: Message[] = [];

  // Add the initial message from the conversation source
  if (conversation.source?.body) {
    messages.push({
      id: conversation.source.id || conversation.id,
      role: conversation.source.author?.type === 'user' ? 'user' : 'bot',
      content: conversation.source.body,
      timestamp: conversation.created_at,
      userId: conversation.source.author?.email || '',
      author: conversation.source.author,
    });
  }

  // Add conversation parts (replies)
  if (conversation.conversation_parts?.conversation_parts) {
    conversation.conversation_parts.conversation_parts.forEach((part) => {
      if (part.body) {
        messages.push({
          id: part.id,
          role: part.author?.type === 'user' ? 'user' : 'bot',
          content: part.body,
          timestamp: part.created_at,
          userId: part.author?.email || '',
          author: part.author,
        });
      }
    });
  }

  // Sort messages by timestamp
  return messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

// GET - Retrieve conversation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!INTERCOM_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "INTERCOM_ACCESS_TOKEN is not configured" },
        { status: 500 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    // Get conversation from Intercom
    const conversation = await getConversation(conversationId);
    const messages = convertIntercomToMessages(conversation);

    return NextResponse.json({
      conversationId: conversation.id,
      messages,
      conversation,
    });

  } catch (error: any) {
    console.error("Error retrieving conversation:", error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve conversation",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST - Send message (create conversation or reply to existing)
export async function POST(req: NextRequest) {
  try {
    const body: ConversationRequest = await req.json();
    const { messages, conversationId } = body;

    if (!INTERCOM_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "INTERCOM_ACCESS_TOKEN is not configured" },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const latestMessage = messages[messages.length - 1];
    
    if (!latestMessage.content || !latestMessage.userId) {
      return NextResponse.json(
        { error: "Latest message must have content and userId" },
        { status: 400 }
      );
    }

    const userEmail = latestMessage.userId;
    console.log("Processing message from:", userEmail);
    console.log("Message content:", latestMessage.content);
    console.log("Existing conversation ID:", conversationId);

    let updatedConversation: IntercomConversation;

    if (conversationId) {
      // Reply to existing conversation
      await replyToConversation(conversationId, userEmail, latestMessage.content);
      updatedConversation = await getConversation(conversationId);
      console.log("Replied to existing conversation:", conversationId);
    } else {
      // Create new conversation
      updatedConversation = await createConversation(userEmail, latestMessage.content);
      console.log("Created new conversation:", updatedConversation.id);
    }

    // Convert the updated conversation to our message format
    const updatedMessages = convertIntercomToMessages(updatedConversation);

    const responseData = {
      messages: updatedMessages,
      conversationId: updatedConversation.id,
      conversation: updatedConversation,
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Error processing message:", error);

    // Return a user-friendly error with the original messages
    const { messages } = await req.json().catch(() => ({ messages: [] }));
    
    return NextResponse.json({
      messages: [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: "bot",
          content: "Sorry, there was an issue sending your message. Please try again later.",
          timestamp: Math.floor(Date.now() / 1000),
          userId: "system"
        }
      ],
      error: error.message,
      debug: { 
        context_used: false, 
        error: error.message
      }
    }, { status: 500 });
  }
}