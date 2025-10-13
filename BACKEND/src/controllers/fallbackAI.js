// BACKEND/src/controllers/fallbackAI.js
const fallbackResponses = {
  'greeting': `🌱 **Hello! Welcome to CeylonLeaf AI Assistant!**

I'm your specialized tea plantation expert for Sri Lankan conditions. I can help you with:

• **Pest & Disease Identification** - Describe symptoms and get expert analysis
• **Organic Treatment Solutions** - Safe, effective remedies for your tea fields
• **Cultivation Best Practices** - Optimize your tea production
• **Field Management** - Pruning, fertilization, and maintenance advice
• **Weather & Climate Guidance** - Adapt to Sri Lankan growing conditions

**What would you like to know about your tea plantation today?**`,

  'common': `Based on your description, here's my analysis for Sri Lankan tea plantations:

🌿 **Common Tea Pests in Sri Lanka:**
• Tea Mosquito Bug: Causes leaf curling and sooty mold
• Red Spider Mite: Yellow speckling on leaves
• Tea Tortrix: Leaf rolling and webbing

🌱 **Organic Treatments:**
- Neem oil spray (2%) every 7-10 days
- Garlic-chili extract solution
- Introduce beneficial insects like ladybugs

⚠️ **Chemical Options (Use as last resort):**
- Acaricides for mites (follow manufacturer instructions)
- Contact insecticides for immediate control

🔍 **Next Steps:**
1. Take clear photos of affected leaves
2. Monitor spread daily
3. Isolate severely affected areas

For specific identification, please provide more details about:
- Leaf color changes
- Pest appearance
- Affected plant parts`,

  'general': `As a Sri Lankan tea plantation expert, I recommend:

🔍 **Immediate Actions:**
1. Isolate affected plants if possible
2. Document symptoms with photos
3. Monitor temperature and humidity

🌱 **Preventive Measures:**
- Regular field sanitation
- Proper pruning for air circulation
- Balanced fertilization
- Soil health management

📞 **For immediate assistance:**
Contact your regional plantation manager or agricultural extension officer.

Please describe specific symptoms like:
- Leaf spots color and pattern
- Pest size and movement
- Growth stage of affected plants`,

  'tea_cultivation': `🌱 **Tea Cultivation Best Practices for Sri Lanka:**

**🌿 Pruning Schedule:**
- Light pruning: Every 3-4 years
- Medium pruning: Every 6-8 years  
- Heavy pruning: Every 12-15 years
- Skiffing: Annual maintenance

**🌱 Fertilization Program:**
- NPK ratio: 3:1:2 for mature tea
- Apply during wet season
- Organic compost: 2-3 tons per acre annually
- Micronutrients: Zinc, Boron, Magnesium

**💧 Irrigation Management:**
- Water stress affects quality significantly
- Drip irrigation recommended
- Monitor soil moisture levels
- Mulching to retain moisture

**📈 Yield Optimization:**
- Maintain 4-5 plucking rounds per year
- Two leaves and a bud standard
- Proper spacing: 1.2m x 0.75m
- Regular field inspection

**🌦️ Seasonal Management:**
- Dry season: Focus on irrigation
- Wet season: Disease prevention
- Monsoon: Drainage management
- Inter-monsoon: Quality plucking`,

  'weather_climate': `🌦️ **Weather & Climate Guidance for Sri Lankan Tea:**

**🌧️ Monsoon Management:**
- Ensure proper drainage systems
- Monitor for waterlogging
- Fungal disease prevention
- Adjust plucking schedules

**☀️ Dry Season Care:**
- Implement irrigation systems
- Mulch to retain soil moisture
- Monitor soil pH levels
- Shade management

**🌡️ Temperature Considerations:**
- Optimal: 18-25°C
- High temps: Increase irrigation
- Low temps: Protect young plants
- Monitor microclimates

**💨 Wind Protection:**
- Windbreaks for young plants
- Staking for support
- Pruning to reduce wind resistance
- Erosion control measures

**📊 Climate Change Adaptation:**
- Drought-resistant varieties
- Water conservation techniques
- Carbon sequestration practices
- Sustainable farming methods`
};

const getFallbackResponse = (userMessage) => {
  const message = userMessage.toLowerCase();
  
  // Greeting responses
  if (message.includes('hi') || message.includes('hello') || message.includes('hey') || 
      message.includes('good morning') || message.includes('good afternoon') || 
      message.includes('good evening') || message.includes('thanks') || 
      message.includes('thank you') || message.includes('bye') || 
      message.includes('goodbye') || message.includes('see you')) {
    return fallbackResponses.greeting;
  }
  
  // Tea cultivation questions
  if (message.includes('tea') || message.includes('plant') || message.includes('crop') || 
      message.includes('harvest') || message.includes('pruning') || message.includes('fertilizer') ||
      message.includes('irrigation') || message.includes('soil') || message.includes('yield') || 
      message.includes('quality') || message.includes('cultivation') || message.includes('growing')) {
    return fallbackResponses.tea_cultivation;
  }
  
  // Weather and climate questions
  if (message.includes('weather') || message.includes('climate') || message.includes('rain') || 
      message.includes('monsoon') || message.includes('dry') || message.includes('temperature') ||
      message.includes('humidity') || message.includes('season') || message.includes('drought')) {
    return fallbackResponses.weather_climate;
  }
  
  // Leaf spot disease
  if (message.includes('leaf') || message.includes('yellow') || message.includes('spot')) {
    return `**Leaf Spot Disease Analysis**

🍂 **Symptoms:** Circular brown/yellow spots on leaves, possible leaf drop

🌿 **Organic Treatment:**
- Copper-based fungicides (Bordeaux mixture)
- Remove and destroy infected leaves
- Improve air circulation through pruning

⚠️ **Chemical Control:**
- Systemic fungicides (consult local agricultural office for approved products)
- Apply during cooler hours

🔍 **Prevention:**
- Avoid overhead irrigation
- Maintain proper plant spacing
- Regular field inspection

**Note:** For accurate diagnosis, bring sample to local agricultural center.`;
  }
  
  // Pest infestation
  if (message.includes('bug') || message.includes('insect') || message.includes('pest')) {
    return `**Pest Infestation Analysis**

🐛 **Common Tea Pests:**
- Tea Mosquito Bug: Causes leaf curl and black mold
- Thrips: Silvery streaks on leaves
- Caterpillars: Chewed leaf edges

🌱 **Organic Control:**
- Neem oil extract (5ml per liter)
- Yellow sticky traps
- Biological controls (predatory insects)

⚠️ **Chemical Options:**
- Contact insecticides (pyrethrum-based)
- Apply in early morning or late evening

🛡️ **Safety:**
- Wear protective gear during application
- Follow recommended waiting periods
- Store chemicals securely`;
  }
  
  // Disease specific queries
  if (message.includes('disease') || message.includes('fungus') || message.includes('mold') || 
      message.includes('blight') || message.includes('wilt') || message.includes('rot')) {
    return `**Tea Disease Management**

🦠 **Common Tea Diseases in Sri Lanka:**
- Blister Blight: Caused by Exobasidium vexans
- Root Rot: Phytophthora species
- Leaf Blight: Various fungal pathogens

🌿 **Organic Treatment:**
- Copper-based fungicides
- Proper field sanitation
- Improve drainage
- Remove infected plant material

⚠️ **Chemical Control:**
- Systemic fungicides (when necessary)
- Follow integrated pest management
- Rotate fungicide classes

🔍 **Prevention:**
- Regular field monitoring
- Proper plant spacing
- Good air circulation
- Balanced nutrition

**Important:** Early detection and treatment is crucial for disease management.`;
  }
  
  // General help or unclear queries
  if (message.includes('help') || message.includes('what') || message.includes('how') || 
      message.includes('can you') || message.includes('tell me') || message.length < 5) {
    return fallbackResponses.greeting;
  }
  
  // Default response for other queries
  return fallbackResponses.common;
};

module.exports = { getFallbackResponse };