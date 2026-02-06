require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// Flash is faster than Pro, perfect for speed
// ✅ THE CORRECT STABLE MODEL
// 🚑 BACKUP OPTION 2
// ✅ This is the only model with a generous, stable free tier right now
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
app.post('/chat', async (req, res) => {
  // 1. Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { question, transactions, userStats } = req.body;
    
    // Quick stats for prompt
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

    // 2. Start Streaming Request
    const result = await model.generateContentStream(prompt);

    // 3. Push chunks to client as they arrive
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

const PORT = 5001;
app.listen(PORT, () => console.log(`⚡ Fast Stream Server running on port ${PORT}`));