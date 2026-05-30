// ============================================
// PURPOSE: Handle Vapi API calls for outbound calling
// ============================================

interface CallPayload {
  phoneNumber: string;
  userName: string;
  userEmail: string;
  preferredCourse?: string;
  queryTopic?: string;
}

interface VapiCallResponse {
  id: string;
  status: string;
  [key: string]: unknown;
}

function formatIndianPhone(raw: string): string {
  const clean = raw.replace(/[^\d+]/g, "");

  if (clean.startsWith("+")) {
    if (!/^\+\d{10,15}$/.test(clean)) {
      throw new Error(`Invalid E.164 number: ${clean}`);
    }
    return clean;
  }

  const digits = clean.replace(/\D/g, "");

  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+91${digits.slice(1)}`;

  throw new Error(`Cannot format phone number: "${raw}". Expected 10-digit Indian number.`);
}

export const initiateOutboundCall = async (payload: CallPayload): Promise<VapiCallResponse> => {
  const { phoneNumber, userName, userEmail, preferredCourse, queryTopic } = payload;

  const VAPI_API_KEY = process.env.VAPI_API_KEY;
  const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
  const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;

  if (!VAPI_API_KEY || !VAPI_PHONE_NUMBER_ID || !VAPI_ASSISTANT_ID) {
    throw new Error("Vapi configuration missing. Check VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, VAPI_ASSISTANT_ID in .env");
  }

  let formattedPhone: string;
  try {
    formattedPhone = formatIndianPhone(phoneNumber);
  } catch (e) {
    throw new Error(`Invalid phone number provided: ${(e as Error).message}`);
  }

  const response = await fetch("https://api.vapi.ai/call/phone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId: VAPI_ASSISTANT_ID,
      assistantOverrides: {
        firstMessage: `Hi ${userName}, this is Ava from EduReach College. I'm calling to help you with information about ${preferredCourse || "our programs"}. Do you have a quick moment?`,
        variableValues: {
          studentName: userName,
          studentEmail: userEmail,
          preferredCourse: preferredCourse || "Not specified",
          queryTopic: queryTopic || "General inquiry",
        },
      },
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customer: {
        number: formattedPhone,
        name: userName,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Vapi API Error:", JSON.stringify(errorData, null, 2));
    const vapiMessage = (errorData as { message?: string }).message ?? "Unknown Vapi error";
    throw new Error(`Vapi call failed: ${vapiMessage}`);
  }

  return (await response.json()) as VapiCallResponse;
};