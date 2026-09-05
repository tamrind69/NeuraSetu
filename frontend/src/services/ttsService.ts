import {
  VoiceProfile,
  TTSRequest,
  TTSResponse,
  AudioTrackInfo,
} from './types';
import { apiGet, apiPost } from './apiClient';

/**
 * Service managing Text-to-Speech synthesis, teacher persona voice mappings, and audio stream generation.
 * Connects to Express backend (/api/tts, /api/tts/voices) with local fallbacks.
 */
class TTSService {
  private voiceProfiles: VoiceProfile[] = [
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
   * Synthesizes audio stream from text input based on selected voice/persona.
   */
  async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    const fallback = async (): Promise<TTSResponse> => {
      await new Promise((r) => setTimeout(r, 200));

      const selectedVoice =
        this.voiceProfiles.find((v) => v.personaId === request.personaId) ||
        this.voiceProfiles.find((v) => v.id === request.voiceId) ||
        this.voiceProfiles[0];

      const wordCount = request.text.trim().split(/\s+/).length;
      const estSeconds = Math.max(2, Math.round(wordCount / 2.5));

      return {
        audioUrl: selectedVoice.audioSampleUrl,
        durationSeconds: estSeconds,
        voiceId: selectedVoice.id,
        waveformSnippet: [6, 12, 8, 16, 14, 10, 8, 18, 12, 15, 7, 13, 9, 11],
      };
    };

    return apiPost<TTSResponse>('/tts', request, fallback);
  }

  /**
   * Retrieves registered voice profiles.
   */
  async getAvailableVoices(): Promise<VoiceProfile[]> {
    const fallback = async (): Promise<VoiceProfile[]> => {
      await new Promise((r) => setTimeout(r, 100));
      return this.voiceProfiles;
    };

    return apiGet<VoiceProfile[]>('/tts/voices', fallback);
  }

  /**
   * Generates synchronized module audio track with timestamped cue points.
   */
  async generateModuleAudio(
    moduleId: string,
    _text: string,
    _voiceId: string = 'voice-evelyn'
  ): Promise<AudioTrackInfo> {
    await new Promise((r) => setTimeout(r, 250));

    return {
      trackId: `track-${moduleId}`,
      moduleId,
      audioUrl: `/audio/modules/${moduleId}.mp3`,
      durationSeconds: 1320,
      transcriptCuePoints: [
        { timestamp: 0, text: 'Welcome to this module on the Electron Transport Chain.' },
        { timestamp: 45, text: 'Observe the four multimeric protein complexes in the cristae folds.' },
        {
          timestamp: 725,
          text: 'As electrons cascade through Complexes I, III, and IV, free energy drives protons across the membrane.',
        },
        {
          timestamp: 1200,
          text: 'Notice how this sets up the proton-motive force powering ATP Synthase.',
        },
      ],
    };
  }

  /**
   * Simulates playback of a sample voice audio snippet.
   */
  async playAudioPreview(_voiceId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
  }
}

export const ttsService = new TTSService();
