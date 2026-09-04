import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  File,
  Loader2,
  BookOpen,
  HelpCircle,
  Dna,
  Cpu,
  Atom,
  Globe,
} from 'lucide-react';
import { useLesson, useNavigation } from '../context';
import { topicPresets } from '../data/mockData';

export const UploadTopicPage: React.FC = () => {
  const {
    creationMode,
    setCreationMode,
    topicInput,
    setTopicInput,
    subjectInput,
    setSubjectInput,
    uploadedFile,
    setUploadedFile,
    simulateFileUpload,
    selectedPreset,
    selectPreset,
  } = useLesson();
  const { goToStep } = useNavigation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [learningObjectivesInput, setLearningObjectivesInput] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_teacher_create_lesson_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.topicNotes) return parsed.topicNotes;
      }
    } catch (e) {
      // ignore
    }
    return '1. Trace electrons from NADH to Oxygen\n2. Understand how the proton gradient is established in the intermembrane space\n3. Calculate ATP yield from rotary ATP synthase';
  });

  // Sync back to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_teacher_create_lesson_draft');
      const parsed = saved ? JSON.parse(saved) : {};
      localStorage.setItem(
        'ai_teacher_create_lesson_draft',
        JSON.stringify({
          ...parsed,
          topicTitle: topicInput,
          subject: subjectInput,
          topicNotes: learningObjectivesInput,
          lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      );
    } catch (e) {
      // ignore
    }
  }, [topicInput, subjectInput, learningObjectivesInput]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateFileUpload(e.target.files[0]);
    }
  };

  const handleSimulateDefaultFile = () => {
    // Create a mock File object
    const mockFile = new window.File(
      ['AP_Biology_Unit3_Cellular_Energetics_Textbook_Ch9.pdf'],
      'AP_Bio_Cellular_Respiration_Ch9.pdf',
      { type: 'application/pdf' }
    );
    simulateFileUpload(mockFile);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Step Tracker */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <span>Step 2 of 4</span>
          <span>•</span>
          <span>Upload & Topic Definition</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Define Your Learning Material
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Provide the topic details or upload class notes. The AI Teacher will analyze the key concepts, prerequisite dependencies, and scaffold interactive lecture segments.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setCreationMode('topic')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            creationMode === 'topic'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Topic & Prompt</span>
        </button>
        <button
          onClick={() => setCreationMode('upload')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            creationMode === 'upload'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Document Upload</span>
        </button>
        <button
          onClick={() => setCreationMode('curated')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            creationMode === 'curated'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curated Presets</span>
        </button>
      </div>

      {/* Main Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Primary Input Panel (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. DOCUMENT UPLOAD MODE */}
          {creationMode === 'upload' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Upload Course Documents</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PDF lecture slides, textbooks, syllabus documents, DOCX notes, and markdown.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                  dragActive
                    ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,.txt"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drag and drop your file here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    PDF, PPTX, or DOCX up to 50 MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSimulateDefaultFile();
                  }}
                  className="mt-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                >
                  ⚡ Click to Load Sample: AP_Bio_Cellular_Respiration_Ch9.pdf
                </button>
              </div>

              {/* Uploaded File Feedback Card */}
              {uploadedFile && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{uploadedFile.name}</p>
                        <span className="text-[11px] text-slate-500">{uploadedFile.size} • {uploadedFile.status.toUpperCase()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadedFile.uploadProgress}%` }}
                    />
                  </div>

                  {uploadedFile.status === 'ready' && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/80">
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Key Pedagogical Themes Extracted:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {uploadedFile.extractedTopics.map((top) => (
                          <span
                            key={top}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium"
                          >
                            {top}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. TOPIC & PROMPT MODE */}
          {creationMode === 'topic' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Topic & Learning Objectives</h3>
                <p className="text-xs text-slate-500">
                  Specify the subject and specific standard or curriculum topic you wish to master.
                </p>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Lesson Topic Title
                </label>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. Cellular Respiration & ATP Synthesis"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-sm font-medium text-slate-800"
                />
              </div>

              {/* Subject Tag Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Subject / Curriculum Domain
                </label>
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder="e.g. AP Biology Unit 3"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-sm font-medium text-slate-800"
                />
              </div>

              {/* Learning Objectives */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Key Learning Objectives & Guidance (Optional)
                </label>
                <textarea
                  rows={4}
                  value={learningObjectivesInput}
                  onChange={(e) => setLearningObjectivesInput(e.target.value)}
                  placeholder="What specific misconceptions or formulas should the AI Teacher highlight?"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-xs font-medium text-slate-700 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* 3. CURATED PRESETS MODE */}
          {creationMode === 'curated' && (
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Select a Curated Masterclass Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topicPresets.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => selectPreset(preset)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                            {preset.subject}
                          </span>
                          <span className="text-xs text-slate-400">{preset.estimatedMinutes}m</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{preset.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{preset.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        {preset.concepts.map((c) => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Info Panel: Prerequisites & Extracted Insights (1 col) */}
        <div className="space-y-6">
          {/* Concept Map Scaffold */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Scaffolded Concepts</span>
            </h4>
            <p className="text-xs text-slate-500">
              The AI will automatically generate interactive slides and assessments covering these foundational pillars:
            </p>

            <ul className="space-y-2.5">
              {[
                { title: 'Cytosolic Glycolysis', desc: 'Net 2 ATP + 2 NADH' },
                { title: 'Citric Acid Cycle', desc: 'Matrix mitochondrial oxidation' },
                { title: 'Proton Gradient', desc: 'Intermembrane space H+ concentration' },
                { title: 'Chemiosmosis & ATP Synthase', desc: 'Rotary stator-rotor mechanics' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">{item.title}</span>
                    <span className="block text-[11px] text-slate-400">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Prerequisite Check */}
          <div className="bg-amber-50/70 rounded-2xl border border-amber-200/80 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Prerequisites Verified</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Based on Alex's prior completed lesson on <span className="font-semibold">Macromolecules & Enzymes</span>, foundational biochemistry prerequisites are 100% met.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={() => goToStep('create')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Mode</span>
        </button>

        <button
          type="button"
          onClick={() => goToStep('personalization')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all hover:translate-x-0.5"
        >
          <span>Continue to Personalization</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
