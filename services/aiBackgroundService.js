// services/aiBackgroundService.js
import axios from 'axios';

class AiBackgroundService {
  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.stabilityKey = process.env.STABILITY_AI_API_KEY;
  }

  async generateBackground(noBackgroundImage, prompt) {
    // Проверяем доступные API ключи
    if (this.openaiKey && this.openaiKey !== 'your_openai_api_key_here') {
      return await this.generateWithDalle(prompt);
    } else if (this.stabilityKey && this.stabilityKey !== 'your_stability_ai_key_here') {
      return await this.generateWithStabilityAI(prompt);
    } else {
      return await this.simulateBackgroundGeneration(prompt);
    }
  }

  async generateWithDalle(prompt) {
    try {
      const enhancedPrompt = `${prompt}, professional photography, realistic lighting and shadows, high quality background`;
      
      const response = await axios.post('https://api.openai.com/v1/images/generations', {
        model: "dall-e-3",
        prompt: enhancedPrompt,
        size: "1024x1024",
        quality: "standard",
        n: 1
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('DALL-E 3 background generated');
      return response.data.data[0].url;

    } catch (error) {
      console.error('DALL-E API Error:', error.response?.data || error.message);
      throw new Error(`AI background generation failed: ${error.message}`);
    }
  }

  async generateWithStabilityAI(prompt) {
    try {
      const response = await axios.post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: 1,
      }, {
        headers: {
          'Authorization': `Bearer ${this.stabilityKey}`,
          'Content-Type': 'application/json'
        }
      });

      const imageBase64 = response.data.artifacts[0].base64;
      return `data:image/png;base64,${imageBase64}`;

    } catch (error) {
      console.error('Stability AI API Error:', error.response?.data || error.message);
      throw new Error(`AI background generation failed: ${error.message}`);
    }
  }

  async simulateBackgroundGeneration(prompt) {
    console.log('Simulating AI background generation for prompt:', prompt);
    
    // Возвращаем placeholder изображение
    const colors = ['4A90E2', '50E3C2', 'B8E986', 'F5A623', 'D0021B'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    return `https://via.placeholder.com/1024x1024/${randomColor}/FFFFFF?text=${encodeURIComponent(prompt)}`;
  }
}

export default AiBackgroundService;