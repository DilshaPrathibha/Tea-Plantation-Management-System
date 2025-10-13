const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getFallbackResponse } = require('./fallbackAI');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced prompt system for different types of queries
const getPromptForMessage = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Greeting and general conversation
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey') || 
      lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon') || 
      lowerMessage.includes('good evening') || lowerMessage.includes('thanks') || 
      lowerMessage.includes('thank you') || lowerMessage.includes('bye') || 
      lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
    
    return `You are CeylonLeaf AI, a tea plantation expert for Sri Lankan farmers. The user said: "${message}"

Respond briefly and warmly. Offer to help with tea farming questions. Keep response under 50 words.`;
  }
  
  // Pest and disease specific queries
  if (lowerMessage.includes('pest') || lowerMessage.includes('disease') || lowerMessage.includes('bug') || 
      lowerMessage.includes('insect') || lowerMessage.includes('leaf') || lowerMessage.includes('spot') || 
      lowerMessage.includes('yellow') || lowerMessage.includes('brown') || lowerMessage.includes('fungus') || 
      lowerMessage.includes('mold') || lowerMessage.includes('infestation') || lowerMessage.includes('damage') ||
      lowerMessage.includes('symptom') || lowerMessage.includes('treatment') || lowerMessage.includes('cure') ||
      lowerMessage.includes('threat') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
    
    return `You are CeylonLeaf AI, a tea plantation expert for Sri Lankan conditions. The user is describing: "${message}"

Provide a concise solution with:

**IDENTIFICATION:** What pest/disease this is
**TREATMENT:** Specific product name and dosage (Sri Lankan brands: Hayleys, CIC, Commercial Company)
**COST:** Price in LKR
**WHERE TO BUY:** Location (Colombo/Kandy/regional stores)
**APPLICATION:** How and when to apply
**PREVENTION:** One key prevention tip

Keep response under 150 words. Be direct and practical.`;
  }
  
  // Fertilizer specific queries
  if (lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrient') || lowerMessage.includes('npk') ||
      lowerMessage.includes('feeding') || lowerMessage.includes('nutrition') || lowerMessage.includes('compost')) {
    
    return `You are CeylonLeaf AI, a tea nutrition expert for Sri Lankan plantations. The user is asking about: "${message}"

Provide concise fertilizer advice:

**BEST BRAND:** Specific product name (Hayleys/CIC/Commercial Company)
**NPK RATIO:** Recommended ratio for tea
**COST:** Price per kg in LKR
**WHERE TO BUY:** Location (Colombo/Kandy/regional)
**APPLICATION:** How much per acre, when to apply
**ORGANIC OPTION:** Alternative organic choice

Keep response under 120 words. Be specific and practical.`;
  }
  
  // General tea farming questions
  if (lowerMessage.includes('tea') || lowerMessage.includes('plant') || lowerMessage.includes('crop') || 
      lowerMessage.includes('harvest') || lowerMessage.includes('pruning') || lowerMessage.includes('fertilizer') ||
      lowerMessage.includes('irrigation') || lowerMessage.includes('soil') || lowerMessage.includes('weather') ||
      lowerMessage.includes('climate') || lowerMessage.includes('yield') || lowerMessage.includes('quality')) {
    
    return `You are CeylonLeaf AI, a tea plantation expert for Sri Lankan conditions. The user is asking about: "${message}"

Provide concise advice:

**ANSWER:** Direct answer to their question
**ACTION:** What they should do
**TIMING:** When to do it
**COST:** Approximate cost if relevant
**TIP:** One practical tip

Keep response under 100 words. Be direct and helpful.`;
  }
  
  // Default concise response
  return `You are CeylonLeaf AI, a tea plantation expert for Sri Lankan farmers. The user said: "${message}"

Provide a brief, helpful response under 80 words. Be direct and offer specific assistance with tea farming questions.`;
};

const analyzePestDisease = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("🧠 Gemini analyzing:", message);
    console.log("🔑 API Key:", process.env.GEMINI_API_KEY ? "Exists" : "MISSING!");
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.log("⚠️ GEMINI_API_KEY is missing or not configured");
      // Use fallback response when API key is missing
      const fallbackResponse = getFallbackResponse(message);
      return res.json({
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        isAI: false,
        isFallback: true,
        modelUsed: "fallback"
      });
    }

    // Try the current working model names (updated for 2024)
    const modelNames = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro"
    ];

    let lastError = null;

    // Try each model name until one works
    for (const modelName of modelNames) {
      try {
        console.log(`🔧 Trying model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = getPromptForMessage(message);
        
        console.log("📡 Sending request to Gemini API...");
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        
        console.log("✅ SUCCESS! Response received from:", modelName);
        
        return res.json({
          response: aiResponse,
          timestamp: new Date().toISOString(),
          isAI: true,
          isFallback: false,
          modelUsed: modelName
        });
        
      } catch (modelError) {
        console.log(`❌ Model ${modelName} failed:`, modelError.message);
        lastError = modelError;
        continue; // Try next model
      }
    }

    // If all models failed, use fallback
    console.log("🔄 All Gemini models failed, using fallback response");
    const fallbackResponse = getFallbackResponse(message);
    
    return res.json({
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      isAI: false,
      isFallback: true,
      modelUsed: "fallback",
      error: lastError?.message
    });

  } catch (error) {
    console.error("❌ AI analysis failed:", error.message);
    
    // Use fallback response for any error
    const fallbackResponse = getFallbackResponse(message);
    
    return res.json({
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      isAI: false,
      isFallback: true,
      modelUsed: "fallback",
      error: error.message
    });
  }
};

// Test function to check API key and models
const testGeminiConnection = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        status: "error",
        message: "❌ GEMINI_API_KEY is missing from .env file",
        hasApiKey: false
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Simple test prompt
    const result = await model.generateContent("Say 'Hello' in Sinhala and Tamil");
    const response = result.response.text();

    res.json({
      status: "success",
      message: "✅ Gemini API is working!",
      hasApiKey: true,
      testResponse: response,
      apiKeyPreview: process.env.GEMINI_API_KEY.substring(0, 10) + "..."
    });

  } catch (error) {
    res.json({
      status: "error", 
      message: `❌ Gemini API test failed: ${error.message}`,
      hasApiKey: !!process.env.GEMINI_API_KEY,
      error: error.message
    });
  }
};

module.exports = { analyzePestDisease, testGeminiConnection };