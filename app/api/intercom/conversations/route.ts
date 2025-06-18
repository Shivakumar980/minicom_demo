import { NextRequest, NextResponse } from 'next/server';
import { createOrFindUser } from '@/app/lib/users';
// Intercom API configuration
const INTERCOM_API_URL = 'https://api.intercom.io';
const INTERCOM_ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN;

export async function GET(req: NextRequest) {
}

// Handle sending chat messages
export async function POST(req: NextRequest) {
  try {
    // Extract data from the request body
    const { messages, conversationId } = await req.json();
    const latestMessage = messages[messages.length - 1];

    console.log("Latest Message:", latestMessage.content);

    if (!INTERCOM_ACCESS_TOKEN) {
      throw new Error("INTERCOM_ACCESS_TOKEN is not configured");
    }

    const userEmail = latestMessage.userId

    // Create or find user in Intercom
    const intercomUser = await createOrFindUser(userEmail);

    const responseData = {
      // TODO: This is not a real response. Needs to be implemented
      messages,
    };
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error processing message:", error);

    return NextResponse.json({
      response: "Sorry, there was an issue. Please try again later.",
      debug: { context_used: false, error: error.message }
    }, { status: 500 });
  }
}
