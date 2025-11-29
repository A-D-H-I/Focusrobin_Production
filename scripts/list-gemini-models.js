/**
 * Script to list available Gemini models for your API key
 * Run with: node scripts/list-gemini-models.js
 */

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!API_KEY) {
  console.error('❌ GOOGLE_GENERATIVE_AI_API_KEY not found in environment');
  console.log('Make sure to run: $env:GOOGLE_GENERATIVE_AI_API_KEY="your-key" (PowerShell)');
  process.exit(1);
}

async function listModels() {
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + API_KEY;
    
    console.log('🔍 Fetching available models from Google Gemini API...\n');
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data.error || data);
      return;
    }
    
    if (data.models && data.models.length > 0) {
      console.log(`✅ Found ${data.models.length} available models:\n`);
      
      // Filter models that support generateContent
      const generateContentModels = data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      console.log('📝 Models supporting generateContent:\n');
      generateContentModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log(`   Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log('');
      });
      
      // Show model IDs (the part after "models/")
      console.log('\n🎯 Model IDs to use in code:\n');
      generateContentModels.forEach((model) => {
        const modelId = model.name.replace('models/', '');
        console.log(`   "${modelId}"`);
      });
      
      // Suggest the best model
      const flashModel = generateContentModels.find(m => 
        m.name.includes('flash') && !m.name.includes('8b')
      );
      const proModel = generateContentModels.find(m => 
        m.name.includes('pro') && !m.name.includes('exp')
      );
      
      console.log('\n💡 Recommended models:\n');
      if (flashModel) {
        const modelId = flashModel.name.replace('models/', '');
        console.log(`   Fast & Free: "${modelId}"`);
      }
      if (proModel) {
        const modelId = proModel.name.replace('models/', '');
        console.log(`   More Capable: "${modelId}"`);
      }
      
    } else {
      console.log('⚠️  No models found in response');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
  }
}

listModels();

