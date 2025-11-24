// server.js
import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// ES modules fix для __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Настройка Multer для памяти (Railway лучше работает с memoryStorage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Импорты сервисов (будем создавать дальше)
import RemoveBgService from './services/removeBgService.js';
import AiBackgroundService from './services/aiBackgroundService.js';

// Инициализация сервисов
const removeBgService = new RemoveBgService();
const aiBackgroundService = new AiBackgroundService();

// Маршруты
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Background Replacement API is Live!',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/upload',
      test: 'POST /api/test-upload',
      status: 'GET /api/status'
    },
    documentation: 'https://github.com/your-username/background-replacement-api'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      remove_bg: 'configured',
      ai_generation: 'configured'
    }
  });
});

// Основной эндпоинт для загрузки
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const prompt = req.body.prompt || 'professional studio background with soft lighting';
    
    console.log(`Processing image: ${req.file.originalname}, prompt: "${prompt}"`);

    // Здесь будет полная обработка
    const result = await processImage(req.file, prompt);
    
    res.json({
      success: true,
      message: 'Image processed successfully',
      ...result,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ 
      error: 'Image processing failed',
      details: error.message 
    });
  }
});

// Тестовый эндпоинт
app.post('/api/test-upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const prompt = req.body.prompt || 'beach sunset background';
    
    // Имитация обработки для теста
    const result = await simulateProcessing(req.file, prompt);
    
    res.json({
      success: true,
      message: 'TEST MODE - Image processing simulated',
      ...result,
      note: 'This is a simulation. Enable real processing in production.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Функция обработки изображения
async function processImage(file, prompt) {
  const startTime = Date.now();
  
  try {
    // 1. Удаляем фон
    console.log('Removing background...');
    const noBgResult = await removeBgService.removeBackground(file.buffer, file.originalname);
    
    // 2. Генерируем новый фон
    console.log('Generating new background...');
    const finalResult = await aiBackgroundService.generateBackground(noBgResult, prompt);
    
    const processingTime = Date.now() - startTime;
    
    return {
      original: `Original image processed (${file.size} bytes)`,
      processed: finalResult,
      prompt: prompt,
      processingTime: `${processingTime}ms`
    };
    
  } catch (error) {
    throw new Error(`Processing failed: ${error.message}`);
  }
}

// Функция имитации обработки
async function simulateProcessing(file, prompt) {
  const startTime = Date.now();
  
  // Имитируем этапы обработки
  await new Promise(resolve => setTimeout(resolve, 2000)); // Remove.bg
  await new Promise(resolve => setTimeout(resolve, 3000)); // AI Generation
  
  const processingTime = Date.now() - startTime;
  
  return {
    original: `TEST: ${file.originalname} (${file.size} bytes)`,
    processed: 'https://via.placeholder.com/1024x1024/4A90E2/FFFFFF?text=AI+Generated+Background',
    prompt: prompt,
    processingTime: `${processingTime}ms`,
    steps: [
      'Background removal - SIMULATED',
      'AI background generation - SIMULATED',
      'Light matching - SIMULATED'
    ]
  };
}

// WebSocket для реального времени
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('camera-upload', async (data) => {
    console.log('Camera upload received:', data);
    
    socket.emit('processing-status', { 
      status: 'started', 
      message: 'Starting background removal...' 
    });
    
    // Имитация обработки через WebSocket
    setTimeout(() => {
      socket.emit('processing-status', { 
        status: 'background_removed', 
        message: 'Generating new background...' 
      });
    }, 2000);
    
    setTimeout(() => {
      socket.emit('processing-complete', {
        status: 'completed',
        result: {
          original: 'https://example.com/original.jpg',
          processed: 'https://example.com/processed.jpg',
          prompt: data.prompt
        }
      });
    }, 5000);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🎉 Background Replacement API Started!
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🚀 Ready for deployment!
  `);
});

export default app;