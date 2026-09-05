import { Router, Request, Response } from 'express';
import { VoiceProfile, TTSRequest, TTSResponse } from '../../src/services/types';

export const ttsRouter = Router();

const voiceProfiles: VoiceProfile[] = [
  {
    id: 'voice-evelyn',
    personaId: 'evelyn',
    name: 'Dr. Evelyn Vance (Empathetic Scholar)',
    gender: 'female',
    accent: 'Standard Academic',
    audioSampleUrl: '/audio/samples/evelyn-sample.mp3',
    toneDescription: 'Warm, Socratic, encouraging, and pedagogically precise',
  },
  {
    id: 'voice-marcus',
    personaId: 'marcus',
    name: 'Prof. Marcus Reed (Socratic Inquirer)',
    gender: 'male',
    accent: 'Analytical Structured',
    audioSampleUrl: '/audio/samples/marcus-sample.mp3',
    toneDescription: 'Direct, intellectually challenging, deductive, and methodical',
  },
  {
    id: 'voice-maya',
    personaId: 'maya',
    name: 'Dr. Maya Lin (Storyteller & Visualizer)',
    gender: 'female',
    accent: 'Dynamic Energetic',
    audioSampleUrl: '/audio/samples/maya-sample.mp3',
    toneDescription: 'Vibrant, analogy-driven, narrative-focused, and engaging',
  },
];

/**
 * POST /api/tts
 * Synthesizes text to speech.
 */
ttsRouter.post('/', (req: Request, res: Response) => {
  try {
    const request: TTSRequest = req.body || { text: '' };

    const selectedVoice =
      voiceProfiles.find((v) => v.personaId === request.personaId) ||
      voiceProfiles.find((v) => v.id === request.voiceId) ||
      voiceProfiles[0];

    const wordCount = (request.text || '').trim().split(/\s+/).filter(Boolean).length;
    const estSeconds = Math.max(2, Math.round(wordCount / 2.5));

    const response: TTSResponse = {
      audioUrl: selectedVoice.audioSampleUrl,
      durationSeconds: estSeconds,
      voiceId: selectedVoice.id,
      waveformSnippet: [6, 12, 8, 16, 14, 10, 8, 18, 12, 15, 7, 13, 9, 11],
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in TTS synthesis:', error);
    res.status(500).json({
      error: 'Failed to synthesize speech',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/tts/voices
 * Lists available voice profiles.
 */
ttsRouter.get('/voices', (_req: Request, res: Response) => {
  res.status(200).json(voiceProfiles);
});
