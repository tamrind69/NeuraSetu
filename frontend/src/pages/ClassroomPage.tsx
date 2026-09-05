import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Subtitles,
  Maximize2,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  RotateCcw,
  Zap,
  Loader2,
} from 'lucide-react';
import { useLesson, useNavigation } from '../context';
import { translationService } from '../services';
import { useAsyncAction } from '../hooks';

export const ClassroomPage: React.FC = () => {
  const {
    currentLesson,
    activeTeacher,
    activeModuleIndex,
    setActiveModuleIndex,
    activeSlideIndex,
    setActiveSlideIndex,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    playbackSpeed,
    setPlaybackSpeed,
    showCaptions,
    setShowCaptions,
    isMuted,
    setIsMuted,
    chatMessages,
    sendStudentQuestion,
  } = useLesson();
  const { goToStep } = useNavigation();

  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [questionInput, setQuestionInput] = useState('');
  const [captionLanguage, setCaptionLanguage] = useState<'en' | 'es' | 'fr'>('en');

  // Simulate video playback ticker
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => (prev < 1320 ? prev + 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime]);

  const activeModule = currentLesson.modules[activeModuleIndex] || currentLesson.modules[0];
  const activeSlide = currentLesson.slides[activeSlideIndex] || currentLesson.slides[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const {
    execute: executeSendQuestion,
    isLoading: isSendingQuestion,
  } = useAsyncAction(
    async (text: string) => {
      await sendStudentQuestion(text);
    }
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questionInput.trim() && !isSendingQuestion) {
      const q = questionInput.trim();
      setQuestionInput('');
      await executeSendQuestion(q);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Classroom Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE AI CLASSROOM
            </span>
            <span className="text-xs text-slate-500">
              {currentLesson.subject}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentLesson.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => goToStep('interactive-question')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm shadow-amber-500/20 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Launch Checkpoint Question</span>
          </button>
          <button
            onClick={() => goToStep('assessment')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
          >
            <span>Skip to Assessment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Classroom Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Video Stage & Interactive Slide */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between min-h-[480px]">
            {/* Top Video Overlay Bar */}
            <div className="p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                {/* Teacher Video PIP Thumbnail */}
                <div className="relative group">
                  <img
                    src={activeTeacher.avatar}
                    alt={activeTeacher.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/80 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {activeTeacher.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      SPEECH SYNTH
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Module 3: Electron Transport Chain & Proton Gradients
                  </p>
                </div>
              </div>

              {/* Audio Waveform Indicator */}
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-medium mr-1 hidden sm:inline">Voice Wave:</span>
                {[4, 12, 8, 16, 10, 14, 6, 12].map((height, i) => (
                  <span
                    key={i}
                    style={{ height: `${isPlaying ? height : 4}px` }}
                    className="w-0.5 bg-emerald-400 rounded-full transition-all duration-150"
                  />
                ))}
              </div>
            </div>

            {/* Central Canvas Slide Display (Visual Diagram) */}
            <div className="px-6 py-4 flex-1 flex flex-col items-center justify-center text-center relative z-10">
              <div className="max-w-xl w-full bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 backdrop-blur-md space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Slide {activeSlideIndex + 1} of {currentLesson.slides.length}: {activeSlide.title}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Interactive Diagram</span>
                </div>

                {/* SVG Biological Diagram: Mitochondria Cristae & ETC */}
                <div className="relative w-full h-44 rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
                  <svg viewBox="0 0 500 160" className="w-full h-full">
                    {/* Intermembrane Space (Top Layer - High Proton H+ Density) */}
                    <rect x="10" y="10" width="480" height="40" rx="8" fill="#134e4a" opacity="0.35" />
                    <text x="25" y="26" fill="#2dd4bf" fontSize="11" fontWeight="bold">
                      INTERMEMBRANE SPACE [High H+ Concentration / pH 7.0]
                    </text>
                    
                    {/* Floating Protons in Intermembrane Space */}
                    {[45, 90, 140, 190, 240, 290, 340, 390, 440].map((cx, i) => (
                      <g key={i} className="animate-pulse">
                        <circle cx={cx} cy="38" r="7" fill="#38bdf8" opacity="0.9" />
                        <text x={cx} y="41" textAnchor="middle" fill="#082f49" fontSize="8" fontWeight="bold">
                          H+
                        </text>
                      </g>
                    ))}

                    {/* Inner Mitochondrial Membrane (Lipid Bilayer) */}
                    <rect x="10" y="55" width="480" height="50" rx="6" fill="#1e293b" />
                    <text x="25" y="83" fill="#94a3b8" fontSize="10" fontWeight="600">
                      INNER MITOCHONDRIAL MEMBRANE (CRISTAE)
                    </text>

                    {/* Protein Complexes Embedded */}
                    {/* Complex I */}
                    <rect x="150" y="50" width="36" height="60" rx="4" fill="#6366f1" />
                    <text x="168" y="83" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">I</text>
                    <path d="M 168 115 L 168 45" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />

                    {/* Complex II */}
                    <rect x="210" y="65" width="32" height="45" rx="4" fill="#818cf8" />
                    <text x="226" y="88" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">II</text>

                    {/* Complex III */}
                    <rect x="265" y="50" width="36" height="60" rx="4" fill="#6366f1" />
                    <text x="283" y="83" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">III</text>
                    <path d="M 283 115 L 283 45" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />

                    {/* Complex IV */}
                    <rect x="325" y="50" width="36" height="60" rx="4" fill="#6366f1" />
                    <text x="343" y="83" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">IV</text>
                    <path d="M 343 115 L 343 45" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />

                    {/* ATP Synthase Turbine */}
                    <g transform="translate(400, 48)">
                      <rect x="0" y="5" width="42" height="24" rx="4" fill="#10b981" />
                      <ellipse cx="21" cy="40" rx="18" ry="14" fill="#059669" />
                      <text x="21" y="20" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">Rotor</text>
                      <text x="21" y="43" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">ATP Synth</text>
                      {/* Flow arrow inward to matrix */}
                      <path d="M 21 -3 L 21 55" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow)" />
                    </g>

                    {/* Matrix (Bottom Layer - Lower H+ Density) */}
                    <rect x="10" y="110" width="480" height="40" rx="8" fill="#312e81" opacity="0.3" />
                    <text x="25" y="132" fill="#a5b4fc" fontSize="11" fontWeight="bold">
                      MITOCHONDRIAL MATRIX [Low H+ / Citric Acid Cycle / ATP Synthesis]
                    </text>
                    <text x="400" y="142" fill="#34d399" fontSize="9" fontWeight="bold">
                      ADP + Pi → ATP!
                    </text>
                  </svg>
                </div>

                <div className="text-left space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {activeSlide.subtitle}
                  </p>
                  <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-300">
                    <span className="font-bold text-white">Teacher Focus: </span>
                    {activeSlide.teacherNote}
                  </div>
                </div>
              </div>
            </div>

            {/* Captions Bar */}
            {showCaptions && (
              <div className="px-6 py-2.5 bg-slate-950/90 border-t border-slate-800/80 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-200 font-medium leading-relaxed max-w-2xl mx-auto text-center sm:text-left flex-1">
                  <span className="text-teal-400 font-bold">Dr. Evelyn: </span>
                  {captionLanguage === 'es'
                    ? '"A medida que los electrones caen en cascada a través de los complejos I, III y IV, la energía libre impulsa a los protones a través de la membrana de las crestas, creando la batería electroquímica en el espacio intermembranoso."'
                    : captionLanguage === 'fr'
                    ? '"Alors que les électrons tombent en cascade à travers les complexes I, III et IV, l\'énergie libre entraîne les protons à travers la membrane des crêtes, créant la batterie électrochimique dans l\'espace intermembranaire."'
                    : '"As electrons cascade through Complexes I, III, and IV, free energy drives protons across the cristae membrane, creating the electrochemical battery in the intermembrane space."'}
                </p>
                <div className="flex items-center gap-1 shrink-0 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold mr-1 uppercase">Subtitles:</span>
                  {(['en', 'es', 'fr'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setCaptionLanguage(lang)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        captionLanguage === lang
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Timeline & Playback Controls Bar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 z-20 space-y-2">
              {/* Timeline Scrubber */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <div className="relative flex-1 group cursor-pointer">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-400 to-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${(currentTime / 1320) * 100}%` }}
                    />
                  </div>
                  {/* Interactive Checkpoint Marker */}
                  <button
                    onClick={() => goToStep('interactive-question')}
                    title="Interactive Checkpoint #2"
                    className="absolute top-1/2 left-[57%] -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400 ring-4 ring-amber-400/30 hover:scale-125 transition-transform flex items-center justify-center text-[9px] font-bold text-slate-900 shadow-md"
                  >
                    !
                  </button>
                </div>
                <span className="text-xs font-mono text-slate-400 w-10">22:00</span>
              </div>

              {/* Control Buttons Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-9 h-9 rounded-xl bg-white text-slate-900 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-sm"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-slate-900" /> : <Play className="w-4 h-4 fill-slate-900 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setShowCaptions(!showCaptions)}
                    className={`p-2 rounded-lg text-xs font-bold transition-colors ${
                      showCaptions ? 'text-teal-400 bg-teal-400/10' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Subtitles className="w-4 h-4" />
                  </button>

                  {/* Playback speed selector */}
                  <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                    {[1, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                          playbackSpeed === spd ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slide Navigators */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={activeSlideIndex === 0}
                    onClick={() => setActiveSlideIndex(activeSlideIndex - 1)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Prev Slide
                  </button>
                  <span className="text-xs text-slate-400 font-medium">
                    {activeSlideIndex + 1} / {currentLesson.slides.length}
                  </span>
                  <button
                    disabled={activeSlideIndex === currentLesson.slides.length - 1}
                    onClick={() => setActiveSlideIndex(activeSlideIndex + 1)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next Slide
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Checkpoint Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-teal-500/10 border border-amber-300/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Concept Checkpoint #2 Reached!
                </h4>
                <p className="text-xs text-slate-600">
                  Dr. Evelyn Vance has posed an active question on Proton Motive Force localization.
                </p>
              </div>
            </div>

            <button
              onClick={() => goToStep('interactive-question')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition-all shrink-0 flex items-center gap-1.5"
            >
              <span>Answer Question</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 1 Column: Socratic Assistant Chat & Lecture Outline */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[560px] overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 p-2 bg-slate-50/50">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Dr. Evelyn</span>
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Lecture Notes</span>
              </button>
            </div>

            {/* TAB 1: Real-time Socratic Chat */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
                {/* Chat Message Scroll list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {chatMessages.map((msg) => {
                    const isTeacher = msg.sender === 'teacher';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${isTeacher ? 'items-start' : 'items-start flex-row-reverse'}`}
                      >
                        <img
                          src={msg.avatar}
                          alt={msg.senderName}
                          className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                        />
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                            isTeacher
                              ? 'bg-slate-100 text-slate-800 rounded-tl-xs'
                              : 'bg-indigo-600 text-white rounded-tr-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-[10px] opacity-80">{msg.senderName}</span>
                            <span className="text-[9px] opacity-60">{msg.timestamp}</span>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  {isSendingQuestion && (
                    <div className="flex gap-2.5 items-start">
                      <img
                        src={activeTeacher.avatar}
                        alt={activeTeacher.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 animate-pulse ring-2 ring-indigo-400/50"
                      />
                      <div className="bg-slate-100 text-slate-700 rounded-2xl rounded-tl-xs p-3 text-xs leading-relaxed flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                        <span className="italic">{activeTeacher.name} is formulating a response...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Input Form */}
                <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={questionInput}
                    disabled={isSendingQuestion}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder={isSendingQuestion ? `${activeTeacher.name} is responding...` : "Ask a clarifying question..."}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isSendingQuestion || !questionInput.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSendingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: Synchronized Lecture Outline */}
            {activeTab === 'notes' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Syllabus Outline
                  </span>
                  {currentLesson.modules.map((m, idx) => (
                    <div
                      key={m.id}
                      onClick={() => setActiveModuleIndex(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        activeModuleIndex === idx
                          ? 'bg-indigo-50/80 border-indigo-300'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{m.title}</span>
                        <span className="text-[10px] text-slate-400">{m.durationMinutes}m</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{m.description}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Live Slide Notes
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {activeSlide.content.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-teal-500 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
