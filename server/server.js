require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 🧠 BRAIN 1: LOGIC & TEXT (Massive Rate Limits - 14k+ RPD)
const textModel = genAI.getGenerativeModel({ model: "gemma-3-1b-it" });

// 👁️ BRAIN 2: VISION & OCR (Strict Limits, used ONLY for images)
// Note: Using the 8B Flash model as it's the fastest and most reliable for basic OCR
const visionModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// ==========================================
// 1. THE CHATBOT STREAMING ENDPOINT (Uses Text Brain)
// ==========================================
app.post('/chat', async (req, res) => {
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
      You are an elite Chartered Accountant (CA) and Wealth Manager advising a client.
      CLIENT DATA: Balance: ₹${balance}, Savings Rate: ${savingsRate}%.
      RECENT LEDGER: ${JSON.stringify(transactions || [])}
      CLIENT REQUEST: "${question}"
      
      INSTRUCTIONS:
      1. Answer the question directly based on the ledger data. 
      2. Use exactly 2 or 3 short bullet points.
      3. Tone: Professional, executive, and analytical. Use terms like "capital allocation" and "burn rate".
      4. FORMATTING MANDATE: Return ONLY plain text using standard markdown bullets (-). 
      5. BANNED: NEVER output JSON. NEVER use code blocks (\`\`\`). Do not include greetings or disclaimers.
    `;

    // 👇 USES GEMMA
    const result = await textModel.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      res.write(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ text: "Error: " + error.message })}\n\n`);
    res.end();
  }
});

// ==========================================
// 2. AUTONOMOUS VISION SCANNER (Uses Vision Brain)
// ==========================================
app.post('/scan-receipt', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, error: "No image provided" });
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
      You are an elite financial data extraction AI. 
      Analyze this receipt. First, identify the individual items purchased. 
      Based on those items, you MUST categorize the overall transaction into EXACTLY ONE of these categories:
      [ "Food/Dining", "Groceries", "Shopping/Retail", "Transport", "Health/Medical", "Electronics", "Utilities", "Misc" ]
      
      If it's a restaurant, choose "Food/Dining". If it's a supermarket, choose "Groceries". If unsure, choose "Misc".
      
      Return ONLY a raw JSON object. Do not include markdown formatting.
      Format exact match: 
      {
        "merchant": "...", 
        "date": "...", 
        "total": 0, 
        "category": "...", 
        "items": [{"name": "...", "price": 0}]
      }
    `;

    // 👇 USES GEMINI (Because Gemma can't see!)
    const result = await visionModel.generateContent([
      prompt,
      { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
    ]);

    const aiResponseText = result.response.text();
    const cleanedJsonText = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    res.json({ success: true, data: JSON.parse(cleanedJsonText) });

  } catch (error) {
    console.error("Scanning Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. AI EXECUTIVE SUMMARY (Uses Text Brain)
// ==========================================
app.post('/analyze', async (req, res) => {
  try {
    const { balance, transactions } = req.body;
    
    const prompt = `
      You are an elite, highly paid Chartered Accountant (CA) providing a flash-briefing to your client.
      CLIENT DATA: 
      - Current Balance: ₹${balance}
      - Recent Transactions: ${JSON.stringify(transactions)}
      
      YOUR INSTRUCTIONS:
      1. Write exactly 2 sentences analyzing their cash flow health and identifying their primary capital drain (aggregate the data, DO NOT list individual amounts).
      2. Write 1 concluding sentence forecasting their end-of-month liquidity if this burn rate continues.
      3. Speak directly to the client using "you" and "your". 
      4. DO NOT use introductory filler like "Here is a summary". Start immediately with the analysis.
      5. Tone: Clinical, sharp, professional, authoritative. No emojis.
    `;
    
    // 👇 USES GEMMA
    const result = await textModel.generateContent(prompt);
    res.json({ success: true, text: result.response.text().trim() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`⚡ Dual-Brain Server running on port ${PORT}`));