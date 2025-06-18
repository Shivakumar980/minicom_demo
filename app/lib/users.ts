// app/lib/users.ts - Updated with full implementation
const INTERCOM_API_URL = 'https://api.intercom.io';
const INTERCOM_ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN;

export interface IntercomUser {
  type: string;
  id: string;
  user_id?: string;
  email: string;
  name?: string;
  created_at: number;
  updated_at: number;
}

export interface IntercomConversation {
  type: string;
  id: string;
  created_at: number;
  updated_at: number;
  state: string;
  source: {
    type: string;
    id: string;
    delivered_as: string;
    subject: string;
    body: string;
    author: {
      type: string;
      id: string;
      name: string;
      email: string;
    };
    attachments: any[];
    url?: string;
    redacted: boolean;
  };
  contacts: {
    type: string;
    contacts: Array<{
      type: string;
      id: string;
    }>;
  };
  assignee?: {
    type: string;
    id: string;
  };
  conversation_parts: {
    type: string;
    conversation_parts: Array<{
      type: string;
      id: string;
      part_type: string;
      body: string;
      created_at: number;
      updated_at: number;
      author: {
        type: string;
        id: string;
        name?: string;
        email?: string;
      };
      attachments: any[];
      external_id?: string;
      notified_at: number;
      redacted: boolean;
    }>;
  };
}

// Create or find a user in Intercom
export async function createOrFindUser(userEmail: string): Promise<IntercomUser> {
  console.log(`Creating or finding user: ${userEmail}`);
  
  if (!INTERCOM_ACCESS_TOKEN) {
    throw new Error("INTERCOM_ACCESS_TOKEN is not configured");
  }

  try {
    // First, try to find the user
    const searchResponse = await fetch(`${INTERCOM_API_URL}/contacts?email=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.data && searchData.data.length > 0) {
        console.log(`Found existing user: ${userEmail}`);
        return searchData.data[0];
      }
    }

    // If user doesn't exist, create a new one
    console.log(`Creating new user: ${userEmail}`);
    const createResponse = await fetch(`${INTERCOM_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'user',
        email: userEmail,
        name: userEmail.split('@')[0], // Use email prefix as name
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create user: ${createResponse.status} - ${errorText}`);
    }

    const userData = await createResponse.json();
    console.log(`Successfully created user: ${userEmail}`);
    return userData;

  } catch (error) {
    console.error('Error in createOrFindUser:', error);
    throw error;
  }
}

// Create a new conversation
export async function createConversation(userEmail: string, message: string): Promise<IntercomConversation> {
  console.log(`Creating conversation for user: ${userEmail}`);
  
  if (!INTERCOM_ACCESS_TOKEN) {
    throw new Error("INTERCOM_ACCESS_TOKEN is not configured");
  }

  try {
    // First ensure the user exists
    const user = await createOrFindUser(userEmail);

    const response = await fetch(`${INTERCOM_API_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          type: 'user',
          id: user.id,
        },
        body: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create conversation: ${response.status} - ${errorText}`);
    }

    const conversationData = await response.json();
    console.log(`Successfully created conversation: ${conversationData.id}`);
    return conversationData;

  } catch (error) {
    console.error('Error in createConversation:', error);
    throw error;
  }
}

// Reply to an existing conversation
export async function replyToConversation(conversationId: string, userEmail: string, message: string): Promise<void> {
  console.log(`Replying to conversation: ${conversationId}`);
  
  if (!INTERCOM_ACCESS_TOKEN) {
    throw new Error("INTERCOM_ACCESS_TOKEN is not configured");
  }

  try {
    // Ensure the user exists
    const user = await createOrFindUser(userEmail);

    const response = await fetch(`${INTERCOM_API_URL}/conversations/${conversationId}/parts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'user',
        user_id: user.id,
        body: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to reply to conversation: ${response.status} - ${errorText}`);
    }

    console.log(`Successfully replied to conversation: ${conversationId}`);

  } catch (error) {
    console.error('Error in replyToConversation:', error);
    throw error;
  }
}

// Get conversation details
export async function getConversation(conversationId: string): Promise<IntercomConversation> {
  console.log(`Getting conversation: ${conversationId}`);
  
  if (!INTERCOM_ACCESS_TOKEN) {
    throw new Error("INTERCOM_ACCESS_TOKEN is not configured");
  }

  try {
    const response = await fetch(`${INTERCOM_API_URL}/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get conversation: ${response.status} - ${errorText}`);
    }

    const conversationData = await response.json();
    return conversationData;

  } catch (error) {
    console.error('Error in getConversation:', error);
    throw error;
  }
}