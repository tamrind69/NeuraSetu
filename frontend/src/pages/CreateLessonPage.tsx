import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileText,
  Compass,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Layers,
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  Cloud,
  FileEdit,
  Save,
  Trash2,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { useLesson, useNavigation } from '../context';

const DRAFT_STORAGE_KEY = 'ai_teacher_create_lesson_draft';

interface SavedLessonDraft {
  topicTitle: string;
  subject: string;
  topicNotes: string;
  creationMode: 'topic' | 'upload' | 'curated';
  selectedGrade: string;
  selectedCategory: string;
  targetDuration: string;
  learningFocus: string[];
  lastSavedAt: string;
}

export const CreateLessonPage: React.FC = () => {
  const {
    creationMode,
    setCreationMode,
    topicInput,
    setTopicInput,
    subjectInput,
    setSubjectInput,
  } = useLesson();
  const { goToStep } = useNavigation();

  // Primary topic details state
  const [topicTitle, setTopicTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: SavedLessonDraft = JSON.parse(saved);
        if (parsed.topicTitle) return parsed.topicTitle;
      }
    } catch (e) {
      // ignore
    }
    return topicInput || 'Cellular Respiration & ATP Synthesis';
  });

  const [subject, setSubject] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: SavedLessonDraft = JSON.parse(saved);
        if (parsed.subject) return parsed.subject;
      }
    } catch (e) {
      // ignore
    }
    return subjectInput || 'AP Biology';
  });

  const [topicNotes, setTopicNotes] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: SavedLessonDraft = JSON.parse(saved);
        if (parsed.topicNotes) return parsed.topicNotes;
      }
    } catch (e) {
      // ignore
    }
    return '1. Trace electron transport through Complexes I-IV\n2. Highlight H+ accumulation in the intermembrane space\n3. Rotary chemiosmosis catalysis in ATP Synthase';
  });

  // Curriculum calibration settings
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: SavedLessonDraft = JSON.parse(saved);
        if (parsed.selectedGrade) return parsed.selectedGrade;
      }
    } catch (e) {
      // ignore
    }
    return 'High School (AP / Honors)';
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: SavedLessonDraft = JSON.parse(saved);
        if (parsed.selectedCategory) return parsed.selectedCategory;
      }
    } catch (e) {
      // ignore
    }
    return 'Biology & Life Sciences';
  });

  const [targetDuration, setTargetDuration] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: SavedLessonDraft = JSON.parse(saved);
        if (parsed.targetDuration) return parsed.targetDuration;
      }
    } catch (e) {
      // ignore
    }
    return '20 - 25 mins';
  });

  const [learningFocus, setLearningFocus] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: SavedLessonDraft = JSON.parse(saved);
        if (parsed.learningFocus) return parsed.learningFocus;
      }
    } catch (e) {
      // ignore
    }
    return ['Core Concepts', 'Visual Diagramming', 'Interactive Checkpoints'];
  });

  // Auto-save feedback indicators
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(false);
  const isInitialMount = useRef<boolean>(true);

  // Categories and levels options
  const categories = [
    'Biology & Life Sciences',
    'Chemistry & Biochemistry',
    'Physics & Quantum',
    'Mathematics & Calculus',
    'Computer Science & AI',
    'World History & Humanities',
  ];

  const gradeLevels = [
    'Middle School (Grades 6-8)',
    'High School (AP / Honors)',
    'College / Undergraduate',
    'Self-Paced Professional',
  ];

  const durations = [
    '10 - 15 mins (Bite-sized)',
    '20 - 25 mins (Standard Masterclass)',
    '40 - 50 mins (Comprehensive)',
  ];

  const quickTopicSuggestions = [
    {
      title: 'Photosynthesis: Light Reactions & Calvin Cycle',
      subject: 'AP Biology',
      category: 'Biology & Life Sciences',
      notes: 'Focus on Photosystems II and I, water splitting, photophosphorylation, and Rubisco carbon fixation.',
    },
    {
      title: 'Mitochondrial Chemiosmosis & Electron Transport Chain',
      subject: 'AP Biology',
      category: 'Biology & Life Sciences',
      notes: 'Deep dive into Complexes I-IV, inner membrane cristae, proton gradient in the intermembrane space, and rotary ATP synthase.',
    },
    {
      title: 'Quantum Wave-Particle Duality & Double Slit Experiment',
      subject: 'AP Physics C',
      category: 'Physics & Quantum',
      notes: 'De Broglie wavelength, interference patterns, photon observation collapse, and probability density functions.',
    },
    {
      title: 'Attention Mechanism & Transformer Neural Networks',
      subject: 'Computer Science',
      category: 'Computer Science & AI',
      notes: 'Explain Query, Key, Value vectors, scaled dot-product self-attention, and multi-head attention blocks.',
    },
  ];

  // Check if draft was restored on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: SavedLessonDraft = JSON.parse(saved);
        if (parsed.topicTitle) {
          setHasRestoredDraft(true);
          if (parsed.lastSavedAt) {
            setLastSavedTime(parsed.lastSavedAt);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Auto-save effect: Runs whenever user modifies any field
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('saving');

    const timeoutId = setTimeout(() => {
      try {
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const draftData: SavedLessonDraft = {
          topicTitle,
          subject,
          topicNotes,
          creationMode,
          selectedGrade,
          selectedCategory,
          targetDuration,
          learningFocus,
          lastSavedAt: formattedTime,
        };

        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        setSaveStatus('saved');
        setLastSavedTime(formattedTime);

        // Keep context in sync
        setTopicInput(topicTitle);
        setSubjectInput(subject);
      } catch (err) {
        console.error('Error saving to localStorage:', err);
        setSaveStatus('idle');
      }
    }, 400); // 400ms debounce for high responsiveness

    return () => clearTimeout(timeoutId);
  }, [
    topicTitle,
    subject,
    topicNotes,
    creationMode,
    selectedGrade,
    selectedCategory,
    targetDuration,
    learningFocus,
    setTopicInput,
    setSubjectInput,
  ]);

  const toggleFocus = (item: string) => {
    setLearningFocus((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  };

  const handleApplyPreset = (preset: typeof quickTopicSuggestions[0]) => {
    setTopicTitle(preset.title);
    setSubject(preset.subject);
    setSelectedCategory(preset.category);
    setTopicNotes(preset.notes);
    setCreationMode('topic');
  };

  const handleClearDraft = () => {
    if (window.confirm('Clear your saved draft and reset to default topic details?')) {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
      setTopicTitle('Cellular Respiration & ATP Synthesis');
      setSubject('AP Biology');
      setTopicNotes('1. Trace electron transport through Complexes I-IV\n2. Highlight H+ accumulation in the intermembrane space\n3. Rotary chemiosmosis catalysis in ATP Synthase');
      setSelectedGrade('High School (AP / Honors)');
      setSelectedCategory('Biology & Life Sciences');
      setTargetDuration('20 - 25 mins');
      setLearningFocus(['Core Concepts', 'Visual Diagramming', 'Interactive Checkpoints']);
      setHasRestoredDraft(false);
      setLastSavedTime('');
      setSaveStatus('idle');
      setTopicInput('Cellular Respiration & ATP Synthesis');
      setSubjectInput('AP Biology');
    }
  };

  const handleContinue = () => {
    // Ensure context holds the latest values
    setTopicInput(topicTitle);
    setSubjectInput(subject);
    goToStep('upload-topic');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Auto-Save Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            <span>Step 1 of 4</span>
            <span>•</span>
            <span>Lesson Initialization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create a New AI Lesson
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">
            Choose your lesson source and configure target topic details. Your work is automatically saved locally.
          </p>
        </div>

        {/* Live Auto-Save Pill & Action Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 shadow-xs">
            {saveStatus === 'saving' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span className="text-slate-600 font-medium">Auto-saving draft...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-800 font-semibold">
                  Auto-saved {lastSavedTime ? `at ${lastSavedTime}` : 'locally'}
                </span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Draft ready</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearDraft}
            title="Clear stored localStorage draft"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Restored Draft Alert Banner (if loaded from localStorage) */}
      {hasRestoredDraft && (
        <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Draft restored from localStorage:</strong> Your previously entered topic details (
              <em>{topicTitle}</em>) were preserved across browser refresh.
            </span>
          </div>
          <button
            onClick={() => setHasRestoredDraft(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode Selection Cards */}
      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          Choose Creation Source
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Option 1: Topic Prompt */}
          <div
            onClick={() => setCreationMode('topic')}
            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
              creationMode === 'topic'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {creationMode === 'topic' && (
              <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Topic or Standard</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Type any curriculum topic, AP standard, or specific learning objective (e.g., "Photosynthesis Calvin Cycle").
              </p>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-md w-fit">
              Fastest • Direct AI Generation
            </span>
          </div>

          {/* Option 2: Upload Learning Material */}
          <div
            onClick={() => setCreationMode('upload')}
            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
              creationMode === 'upload'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {creationMode === 'upload' && (
              <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Upload Documents</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload textbook chapters, lecture PDF slides, class syllabi, or research notes. The AI extracts key themes.
              </p>
            </div>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-100/70 px-2.5 py-1 rounded-md w-fit">
              Custom Material • PDF, PPTX, Docs
            </span>
          </div>

          {/* Option 3: Curated Course Library */}
          <div
            onClick={() => setCreationMode('curated')}
            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
              creationMode === 'curated'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {creationMode === 'curated' && (
              <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Curated Presets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pick from certified STEM and humanities masterclass templates with pre-tuned visual diagrams.
              </p>
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-100/70 px-2.5 py-1 rounded-md w-fit">
              Ready-to-Teach Templates
            </span>
          </div>
        </div>
      </div>

      {/* TOPIC DETAILS INPUT SECTION (With real-time LocalStorage Auto-Save) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-indigo-600" />
            <span>Topic Details & Learning Objectives</span>
          </h3>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Save className="w-3 h-3" />
            Auto-saves continuously to localStorage
          </span>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Quick Preset Prompts (Click to Load & Auto-Save)
          </label>
          <div className="flex flex-wrap gap-2">
            {quickTopicSuggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(sug)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-800 transition-colors text-left"
              >
                + {sug.title}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Topic Title / Concept Standard <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="e.g., Cellular Respiration & ATP Synthesis"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-slate-900"
            />
            <p className="text-[11px] text-slate-400">
              The primary subject module your AI Teacher will present.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Course / Subject Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., AP Biology, Organic Chemistry, Linear Algebra"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-slate-900"
            />
            <p className="text-[11px] text-slate-400">
              Assists the AI Teacher in framing terminology and difficulty level.
            </p>
          </div>
        </div>

        {/* Learning Objectives / Prompt Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Specific Learning Objectives / Special Instructions
          </label>
          <textarea
            rows={3}
            value={topicNotes}
            onChange={(e) => setTopicNotes(e.target.value)}
            placeholder="List specific theorems, formulas, or concepts you want covered..."
            className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 leading-relaxed font-mono"
          />
          <p className="text-[11px] text-slate-400">
            The AI Teacher parses each bullet point into lecture modules and interactive checkpoint questions.
          </p>
        </div>
      </div>

      {/* Target Parameters Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <span>Curriculum Calibration</span>
        </h3>

        {/* Subject Category */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Subject Domain
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-left border transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-400/20'
                    : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Academic Level */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Target Academic Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {gradeLevels.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedGrade(lvl)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-left border transition-all ${
                  selectedGrade === lvl
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-400/20'
                    : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Desired Lesson Duration
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {durations.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => setTargetDuration(dur)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-left border transition-all ${
                  targetDuration === dur
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-400/20'
                    : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {dur}
              </button>
            ))}
          </div>
        </div>

        {/* Pedagogical Focus Tags */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Pedagogical Highlights
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              'Core Concepts',
              'Visual Diagramming',
              'Interactive Checkpoints',
              'Real-World Analogies',
              'AP Exam Prep',
              'Socratic Probing',
            ].map((tag) => {
              const active = learningFocus.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleFocus(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-teal-50 text-teal-800 border-teal-300 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {active && <Check className="w-3 h-3 text-teal-600" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => goToStep('dashboard')}
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold px-4 py-2"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleContinue}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all hover:translate-x-0.5"
        >
          <span>Continue to Upload & Topic Details</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
