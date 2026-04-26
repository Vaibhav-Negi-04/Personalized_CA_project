require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
// Increased limit to 10mb because base64 image strings are large!
app.use(express.json({ limit: '10mb' })); 

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// This flash model supports both text (chat) and vision (images) natively!
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Note: You can also try "gemini-1.5-flash" if 2.0 gives you any trouble!

// ==========================================
// 1. THE CHATBOT STREAMING ENDPOINT (Existing)
// ==========================================
app.post('/chat', async (req, res) => {
  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  try {
    const { question, transactions, userStats } = req.body;
    const balance = userStats?.currentBalance || 0;
    const savingsRate = userStats?.totalIncome > 0 
      ? ((userStats.totalIncome - userStats.totalSpent) / userStats.totalIncome * 100).toFixed(0) 
      : 0;

    const prompt = `
      You are FinBot.
      USER CONTEXT: Balance: ₹${balance}, Savings Rate: ${savingsRate}%.
      RECENT TRANSACTIONS: ${JSON.stringify(transactions || [])}
      USER QUESTION: "${question}"
      
      RULES:
      - Be Short (Max 3 sentences per point).
      - Use emojis.
      - Bullet points only.
    `;

    const result = await model.generateContentStream(prompt);

    // Push chunks to client as they arrive
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error("Stream Error:", error);
    res.write(`data: ${JSON.stringify({ text: "Error: " + error.message })}\n\n`);
    res.end();
  }
});

// ==========================================
// 2. SMART RECEIPT VISION SCANNER 
// ==========================================
app.post('/scan-receipt', async (req, res) => {
  try {
    // React will send the image as a Base64 string
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "No image provided" });
    }

    // Clean the base64 string if React sends it with the data URI prefix (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
      You are an expert OCR and financial data extraction AI. 
      Look at this receipt/invoice image and extract the following information:
      - Total Amount (as a clean number, no currency symbols)
      - Date (as a string)
      - Merchant/Store Name (as a string)
      - List of items bought and their prices
      
      Return ONLY a raw JSON object. Do not include markdown formatting like \`\`\`json or any extra text.
      Format exact match: {"merchant": "...", "date": "...", "total": 0, "items": [{"name": "...", "price": 0}]}
    `;

    // Send the prompt AND the image to Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg" // Tells Gemini how to read the base64 data
        }
      }
    ]);

    const aiResponseText = result.response.text();
    
    // Safety clean: Remove markdown code blocks if the AI accidentally adds them
    const cleanedJsonText = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();

    // Send the extracted, clean JSON back to the React app
    res.json({ success: true, data: JSON.parse(cleanedJsonText) });

  } catch (error) {
    console.error("Scanning Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. NEW: AI EXECUTIVE SUMMARY (No Streaming)
// ==========================================
app.post('/analyze', async (req, res) => {
  try {
    const { balance, transactions } = req.body;
    
    const prompt = `
      You are an elite, highly analytical financial AI.
      Look at this user's current balance: ₹${balance}
      Look at their recent transactions: ${JSON.stringify(transactions)}
      
      Write exactly 2 sentences summarizing their current financial status, and 1 sentence predicting how their month will end based on their spending habits. 
      Do NOT use emojis, markdown, or bullet points. Use plain, highly professional text.
    `;

    const result = await model.generateContent(prompt);
    const aiText = result.response.text();

    res.json({ success: true, text: aiText.trim() });

  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`⚡ Fast Stream Server running on port ${PORT}`));