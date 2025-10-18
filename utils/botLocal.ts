import axios from "axios";

export async function generateBotResponse(history: any) {
  // Format chat history for API request
  const formattedHistory = history.map(({ role, parts }: any) => ({
    role,
    parts: parts || [
      { text: role === "user" ? history.text : history.response },
    ],
  }));

  const requestBody = { contents: formattedHistory };

  const API_URL =
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=AIzaSyBADeAx-1MtrUZIgazRLRL99BiglQiXwpo";

  try {
    const response = await axios.post(API_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error?.message || "Something went wrong!";
    throw new Error(errorMessage);
  }
}
