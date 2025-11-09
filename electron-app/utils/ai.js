/**
 * AI Integration Module
 * Handles OpenAI Vision and Google Gemini API calls
 */

const axios = require('axios');
const fs = require('fs').promises;
const logger = require('./logger');
const { AI, API } = require('./constants');

// Google Generative AI SDK
let genai = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genai = {
    GoogleGenerativeAI,
    available: true
  };
} catch (error) {
  logger.warn('Google Generative AI SDK not available:', error.message);
  genai = { available: false };
}

/**
 * Analyze image with OpenAI Vision API
 * @param {string|Buffer} image - File path or buffer
 * @param {Object} config - Configuration { api_key, model, prompt }
 * @returns {Promise<Object>} {response, duration, success}
 */
async function analyzeWithOpenAI(image, config) {
  const startTime = Date.now();

  try {
    const { api_key, model = 'gpt-4o-mini', prompt } = config;

    if (!api_key || !api_key.trim()) {
      throw new Error('OpenAI API key not configured');
    }

    logger.aiRequest('OpenAI', model);

    // Convert image to base64
    let base64Image;
    if (Buffer.isBuffer(image)) {
      base64Image = image.toString('base64');
    } else {
      // Assume it's a file path
      const imageBuffer = await fs.readFile(image);
      base64Image = imageBuffer.toString('base64');
    }

    // Prepare request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api_key}`
    };

    const payload = {
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: AI.IMAGE_DETAIL
              }
            }
          ]
        }
      ],
      max_tokens: AI.MAX_TOKENS
    };

    // Make request with timeout
    const response = await axios.post(
      `${API.OPENAI.BASE_URL}${API.OPENAI.CHAT_COMPLETIONS}`,
      payload,
      {
        headers,
        timeout: AI.TIMEOUT
      }
    );

    const duration = (Date.now() - startTime) / 1000; // Convert to seconds

    // Extract response
    if (response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message?.content || 'No answer found';

      logger.aiResponse('OpenAI', duration, true);

      return {
        success: true,
        response: content,
        duration: duration,
        model: model,
        usage: response.data.usage
      };
    } else {
      throw new Error('No response from OpenAI');
    }
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    logger.aiResponse('OpenAI', duration, false);

    // Better error messages
    let errorMessage = error.message;
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        errorMessage = 'Invalid API key';
      } else if (status === 429) {
        errorMessage = 'Rate limit exceeded';
      } else if (status === 500) {
        errorMessage = 'OpenAI server error';
      } else if (data?.error?.message) {
        errorMessage = data.error.message;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out';
    }

    logger.error('OpenAI error:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      duration: duration
    };
  }
}

/**
 * Analyze image with Google Gemini API
 * @param {string|Buffer} image - File path or buffer
 * @param {Object} config - Configuration { api_key, model, prompt }
 * @returns {Promise<Object>} {response, duration, success}
 */
async function analyzeWithGemini(image, config) {
  const startTime = Date.now();

  try {
    if (!genai.available) {
      throw new Error('Google Generative AI SDK not installed');
    }

    const { api_key, model = 'gemini-2.0-flash-exp', prompt } = config;

    if (!api_key || !api_key.trim()) {
      throw new Error('Gemini API key not configured');
    }

    logger.aiRequest('Gemini', model);

    // Initialize Gemini client
    const client = new genai.GoogleGenerativeAI(api_key);
    const generativeModel = client.getGenerativeModel({ model: model });

    // Prepare image data
    let imageData;
    if (Buffer.isBuffer(image)) {
      imageData = {
        inlineData: {
          data: image.toString('base64'),
          mimeType: 'image/png'
        }
      };
    } else {
      // Read file
      const imageBuffer = await fs.readFile(image);
      imageData = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/png'
        }
      };
    }

    // Generate content with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), AI.TIMEOUT);
    });

    const generatePromise = generativeModel.generateContent([prompt, imageData]);

    const result = await Promise.race([generatePromise, timeoutPromise]);

    const duration = (Date.now() - startTime) / 1000;

    // Extract response
    if (result.response) {
      const text = result.response.text();

      logger.aiResponse('Gemini', duration, true);

      return {
        success: true,
        response: text,
        duration: duration,
        model: model
      };
    } else {
      throw new Error('No response from Gemini');
    }
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    logger.aiResponse('Gemini', duration, false);

    // Better error messages
    let errorMessage = error.message;
    if (error.message?.includes('API_KEY_INVALID')) {
      errorMessage = 'Invalid API key';
    } else if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'Quota exceeded';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out';
    }

    logger.error('Gemini error:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      duration: duration
    };
  }
}

/**
 * Test OpenAI API connection
 * @param {string} apiKey - API key to test
 * @returns {Promise<Object>} {success, message}
 */
async function testOpenAIConnection(apiKey) {
  try {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: 'API key is required' };
    }

    logger.info('Testing OpenAI connection...');

    const response = await axios.get(
      `${API.OPENAI.BASE_URL}${API.OPENAI.MODELS}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 10000
      }
    );

    if (response.status === 200) {
      logger.info('OpenAI connection test: SUCCESS');
      return { success: true, message: 'Connection successful' };
    } else {
      return { success: false, message: `Unexpected status: ${response.status}` };
    }
  } catch (error) {
    logger.error('OpenAI connection test failed:', error);

    let message = error.message;
    if (error.response?.status === 401) {
      message = 'Invalid API key';
    } else if (error.response?.status === 429) {
      message = 'Rate limit exceeded';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Connection timeout';
    }

    return { success: false, message: message };
  }
}

/**
 * Test Gemini API connection
 * @param {string} apiKey - API key to test
 * @returns {Promise<Object>} {success, message}
 */
async function testGeminiConnection(apiKey) {
  try {
    if (!genai.available) {
      return { success: false, message: 'Google Generative AI SDK not installed' };
    }

    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: 'API key is required' };
    }

    logger.info('Testing Gemini connection...');

    const client = new genai.GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent('Test');

    if (result.response) {
      logger.info('Gemini connection test: SUCCESS');
      return { success: true, message: 'Connection successful' };
    } else {
      return { success: false, message: 'No response from Gemini' };
    }
  } catch (error) {
    logger.error('Gemini connection test failed:', error);

    let message = error.message;
    if (error.message?.includes('API_KEY_INVALID')) {
      message = 'Invalid API key';
    } else if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      message = 'Quota exceeded';
    }

    return { success: false, message: message };
  }
}

/**
 * Analyze image with both AIs in parallel
 * @param {string|Buffer} image - Image to analyze
 * @param {Object} config - Full configuration object
 * @returns {Promise<Object>} {openai: {...}, gemini: {...}}
 */
async function analyzeParallel(image, config) {
  const { api_keys, models, prompt } = config;

  const promises = [];

  // OpenAI
  if (api_keys.openai && api_keys.openai.trim()) {
    promises.push(
      analyzeWithOpenAI(image, {
        api_key: api_keys.openai,
        model: models.openai_model,
        prompt: prompt
      }).then(result => ({ provider: 'openai', result }))
    );
  }

  // Gemini
  if (api_keys.gemini && api_keys.gemini.trim() && genai.available) {
    promises.push(
      analyzeWithGemini(image, {
        api_key: api_keys.gemini,
        model: models.gemini_model,
        prompt: prompt
      }).then(result => ({ provider: 'gemini', result }))
    );
  }

  if (promises.length === 0) {
    return {
      openai: { success: false, error: 'No API keys configured' },
      gemini: { success: false, error: 'No API keys configured' }
    };
  }

  // Use Promise.allSettled to allow partial success
  const results = await Promise.allSettled(promises);

  const output = {};

  results.forEach(settled => {
    if (settled.status === 'fulfilled') {
      const { provider, result } = settled.value;
      output[provider] = result;
    } else {
      // This shouldn't happen since we catch errors in individual functions
      logger.error('Unexpected promise rejection:', settled.reason);
    }
  });

  // Ensure both keys exist
  if (!output.openai) {
    output.openai = { success: false, error: 'Not configured or not executed' };
  }
  if (!output.gemini) {
    output.gemini = { success: false, error: 'Not configured or not available' };
  }

  return output;
}

module.exports = {
  analyzeWithOpenAI,
  analyzeWithGemini,
  testOpenAIConnection,
  testGeminiConnection,
  analyzeParallel
};
