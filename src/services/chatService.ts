import { ChatMessage } from '../types';
import { teacherPersonas } from '../data/mockData';
import { SendMessageRequest, SocraticHintRequest } from './types';
import { apiGet, apiPost } from './apiClient';

/**
 * Service managing real-time Socratic AI tutor dialogue, question handling, and hint generation.
 * Connects to Express backend (/api/chat) with local fallbacks.
 */
class ChatService {
  /**
   * Processes a student inquiry and returns a pedagogically sound Socratic response from the assigned AI mentor.
   */
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    const fallback = async (): Promise<ChatMessage> => {
      await new Promise((r) => setTimeout(r, 400));

      const teacher =
        teacherPersonas.find((p) => p.id === request.personaId) || teacherPersonas[0];

      const q = request.questionText.toLowerCase();

      let replyText = `Superb question, ${request.studentName}! In this specific phase, remember that free energy is conserved through the proton gradient. Even a small change in pH across the cristae shifts the equilibrium constant.`;

      if (q.includes('complex ii') || q.includes('fadh2')) {
        replyText = `Astute inquiry! Complex II (succinate dehydrogenase) accepts electrons from FADH2 at a lower reduction potential than NADH at Complex I. There isn't sufficient thermodynamic free energy (ΔG) released to power proton translocation across the lipid bilayer!`;
      } else if (q.includes('uncoupler') || q.includes('dnp')) {
        replyText = `Brilliant clinical intuition! Uncouplers like 2,4-Dinitrophenol (DNP) carry protons across the membrane, dissipating the electrochemical gradient as heat rather than coupling it to ATP synthesis. How do you think this affects oxygen consumption?`;
      } else if (q.includes('atp') || q.includes('gradient')) {
        replyText = `Think of the intermembrane space as a high-pressure reservoir behind a hydroelectric dam. As the protons flow through the narrow ATP Synthase rotor, their kinetic movement drives the phosphorylation of ADP to ATP.`;
      }

      return {
        id: `msg-${Date.now()}`,
        sender: 'teacher',
        senderName: teacher.name,
        avatar: teacher.avatar,
        text: replyText,
        timestamp: 'Just now',
        isAudioSnippet: true,
      };
    };

    return apiPost<ChatMessage>('/chat', request, fallback);
  }

  /**
   * Retrieves conversation thread history for a lesson.
   */
  async getChatHistory(lessonId: string, _moduleId?: number): Promise<ChatMessage[]> {
    const fallback = async (): Promise<ChatMessage[]> => {
      await new Promise((r) => setTimeout(r, 100));
      return [
        {
          id: 'm1',
          sender: 'teacher',
          senderName: 'Dr. Evelyn Vance',
          avatar: teacherPersonas[0].avatar,
          text: "Welcome to class! We're examining the inner mitochondrial membrane where Complexes I-IV pump protons. Notice how this creates a high H+ concentration gradient in the intermembrane space.",
          timestamp: '10:02 AM',
        },
        {
          id: 'm2',
          sender: 'student',
          senderName: 'Alex Chen',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
          text: 'Why does Complex II not pump any protons across like Complex I does?',
          timestamp: '10:04 AM',
        },
      ];
    };

    return apiGet<ChatMessage[]>(`/chat/${lessonId}`, fallback);
  }

  /**
   * Generates a targeted Socratic hint when a student requests assistance or is stuck.
   */
  async requestSocraticHint(_context: SocraticHintRequest): Promise<string> {
    await new Promise((r) => setTimeout(r, 200));

    return `Consider the physical compartments of the organelle: Complexes I, III, and IV are embedded in the cristae folds and pump H+ ions OUT of the matrix. Which compartment lies immediately on the other side of that inner membrane?`;
  }

  /**
   * Clears or resets the active chat session.
   */
  async clearChatHistory(_lessonId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
  }
}

export const chatService = new ChatService();
