require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  
  try {
    console.log("🔍 Checking available models with your API Key...");
    // Fetch the list of models available to you
    const modelResponse = await genAI.getModel('models/gemini-pro'); 
    // ^ Note: The listModels() method is better, let's use that below:
  } catch (e) {
    // If getting specific model fails, let's list ALL of them
  }

  try {
      // Access the internal list method (depends on SDK version, but this usually works)
      // We will try a fetch to the standard endpoint if SDK fails, 
      // but let's try the direct SDK listing first if possible.
      // Since SDK specific methods vary, let's use a standard fetch to be 100% sure.
      
      const apiKey = process.env.GOOGLE_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
          console.error("\n❌ API ERROR:", data.error.message);
          console.log("👉 SOLUTION: Go to Google Cloud Console, select your project, and ENABLE 'Generative Language API'.");
      } else if (data.models) {
          console.log("\n✅ SUCCESS! Here are the models you can use:");
          data.models.forEach(m => {
              if (m.name.includes('gemini')) console.log(`   - ${m.name.replace('models/', '')}`);
          });
          console.log("\n👉 Update your server.js line to use one of these EXACT names.");
      } else {
          console.log("❓ No models found. This is unusual.");
      }

  } catch (error) {
    console.error("💥 Network Error:", error);
  }
}

checkModels();