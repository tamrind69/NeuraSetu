import { Router, Request, Response } from 'express';
import { LanguageOption, TranslationRequest, TranslationResponse } from '../../src/services/types';

export const translationRouter = Router();

const supportedLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flagEmoji: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flagEmoji: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flagEmoji: '🇫🇷' },
  { code: 'zh', name: 'Mandarin Chinese', nativeName: '中文', flagEmoji: '🇨🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flagEmoji: '🇮🇳' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flagEmoji: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flagEmoji: '🇯🇵' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flagEmoji: '🇸🇦', rtl: true },
];

/**
 * POST /api/translation
 * Translates text into the target language.
 */
translationRouter.post('/', (req: Request, res: Response) => {
  try {
    const request: TranslationRequest = req.body || { text: '', targetLanguageCode: 'en' };

    let translated = request.text;
    if (request.targetLanguageCode === 'es') {
      translated = `[ES] ${request.text.replace(/Protons/gi, 'Protones').replace(/Mitochondria/gi, 'Mitocondria')}`;
    } else if (request.targetLanguageCode === 'fr') {
      translated = `[FR] ${request.text.replace(/Protons/gi, 'Protons').replace(/Mitochondria/gi, 'Mitochondrie')}`;
    } else if (request.targetLanguageCode === 'de') {
      translated = `[DE] ${request.text.replace(/Protons/gi, 'Protonen').replace(/Mitochondria/gi, 'Mitochondrien')}`;
    } else if (request.targetLanguageCode === 'zh') {
      translated = `[ZH] 线粒体与电子传递链: ${request.text}`;
    } else if (request.targetLanguageCode === 'hi') {
      translated = `[HI] माइटोकॉन्ड्रिया और प्रोटॉन ढाल: ${request.text}`;
    }

    const response: TranslationResponse = {
      translatedText: translated,
      sourceLanguageCode: request.sourceLanguageCode || 'en',
      targetLanguageCode: request.targetLanguageCode,
      detectedConfidence: 0.99,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in translation handler:', error);
    res.status(500).json({
      error: 'Failed to translate text',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/translation/languages
 * Returns the list of supported languages.
 */
translationRouter.get('/languages', (_req: Request, res: Response) => {
  res.status(200).json(supportedLanguages);
});
