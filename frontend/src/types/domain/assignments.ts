export interface AssignmentTask {
  id: string;
  title: string;
  type: 'essay' | 'short-answer' | 'multiple-choice' | 'file-upload';
  prompt: string;
  points: number;
  options?: { id: string; text: string }[];
  placeholder?: string;
}

export interface AssignmentResource {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'xlsx' | 'docx' | 'dataset';
}

export interface AssignmentItem {
  id: string;
  title: string;
  subject: string;
  category: string;
  description: string;
  instructorName: string;
  instructorTitle: string;
  instructorAvatar: string;
  dueDate: string;
  dueDateFormatted: string;
  isOverdue?: boolean;
  estimatedTime: string;
  taskCount: number;
  status: 'pending' | 'in-progress' | 'submitted' | 'overdue';
  priority: 'High' | 'Normal' | 'Low';
  instructions: string[];
  tasks: AssignmentTask[];
  resources: AssignmentResource[];
  grade?: {
    score: number;
    maxScore: number;
    feedback: string;
    submittedDate: string;
  };
}

export interface AssignmentSubmissionData {
  assignmentId: string;
  answers: Record<string, string>;
  uploadedFileName?: string;
  uploadedFileSize?: string;
  submittedAt: string;
  status: 'submitted';
}
