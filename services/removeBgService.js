// services/removeBgService.js
import axios from 'axios';
import FormData from 'form-data';

class RemoveBgService {
  constructor() {
    this.apiKey = process.env.REMOVE_BG_API_KEY;
    this.baseURL = 'https://api.remove.bg/v1.0';
  }

  async removeBackground(imageBuffer, filename) {
    // Если API ключ не установлен, используем заглушку
    if (!this.apiKey || this.apiKey === 'your_remove_bg_api_key_here') {
      console.log('Remove.bg API key not set, using simulation');
      return this.simulateRemoveBackground(imageBuffer, filename);
    }

    try {
      const formData = new FormData();
      formData.append('image_file', imageBuffer, {
        filename: filename,
        contentType: 'image/jpeg'
      });
      formData.append('size', 'auto');

      const response = await axios.post(`${this.baseURL}/removebg`, formData, {
        headers: {
          'X-Api-Key': this.apiKey,
          ...formData.getHeaders()
        },
        responseType: 'arraybuffer'
      });

      console.log('Background removed successfully');
      return Buffer.from(response.data);

    } catch (error) {
      console.error('Remove.bg API Error:', error.response?.data || error.message);
      throw new Error(`Background removal failed: ${error.message}`);
    }
  }

  async simulateRemoveBackground(imageBuffer, filename) {
    console.log('Simulating background removal for:', filename);
    // В реальности здесь должна быть настоящая обработка
    // Пока возвращаем оригинальный buffer как заглушку
    return imageBuffer;
  }
}

export default RemoveBgService;