import { Router, Request, Response } from 'express';
import { ChatMessage, SendMessageRequest } from '../../src/types';
import { teacherPersonas } from '../../src/data/mockData';

export const chatRouter = Router();

/**
 * POST /api/chat
 * Socratic AI tutor dialogue endpoint.
 */
chatRouter.post('/', (req: Request, res: Response) => {
  try {
    const request: SendMessageRequest = req.body || {
      lessonId: 'lesson-1',
      questionText: '',
      studentName: 'Alex',
    };

    const teacher =
      teacherPersonas.find((p) => p.id === request.personaId) || teacherPersonas[0];

    const q = (request.questionText || '').toLowerCase();

    let replyText = `Superb question, ${request.studentName || 'Learner'}! In this specific phase, remember that free energy is conserved through the proton gradient. Even a small change in pH across the cristae shifts the equilibrium constant.`;

    if (q.includes('complex ii') || q.includes('fadh2')) {
      replyText = `Astute inquiry! Complex II (succinate dehydrogenase) accepts electrons from FADH2 at a lower reduction potential than NADH at Complex I. There isn't sufficient thermodynamic free energy (ΔG) released to power proton translocation across the lipid bilayer!`;
    } else if (q.includes('uncoupler') || q.includes('dnp')) {
      replyText = `Brilliant clinical intuition! Uncouplers like 2,4-Dinitrophenol (DNP) carry protons across the membrane, dissipating the electrochemical gradient as heat rather than coupling it to ATP synthesis. How do you think this affects oxygen consumption?`;
    } else if (q.includes('atp') || q.includes('gradient')) {
      replyText = `Think of the intermembrane space as a high-pressure reservoir behind a hydroelectric dam. As the protons flow through the narrow ATP Synthase rotor, their kinetic movement drives the phosphorylation of ADP to ATP.`;
    }

    const replyMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'teacher',
      senderName: teacher.name,
      avatar: teacher.avatar,
      text: replyText,
      timestamp: 'Just now',
      isAudioSnippet: true,
    };

    res.status(200).json(replyMessage);
  } catch (error) {
    console.error('Error in chat message handler:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/chat/:lessonId
 * Retrieves conversation thread history for a lesson.
 */
chatRouter.get('/:lessonId', (_req: Request, res: Response) => {
  res.status(200).json([
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
  ]);
});
