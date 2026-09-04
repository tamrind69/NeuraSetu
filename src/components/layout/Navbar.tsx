import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Award,
  GraduationCap,
  RotateCcw,
  BookOpen,
  LayoutDashboard,
  PlayCircle,
  CheckCircle2,
  BarChart3,
  Compass,
  FileCheck,
  CheckSquare,
  Menu,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserProfile, useNavigation, useLesson } from '../../context';

export const Navbar: React.FC = () => {
  const { userProfile } = useUserProfile();
  const { resetFlow } = useNavigation();
  const { activeTeacher } = useLesson();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { path: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/lesson/create', label: 'Create Lesson', icon: BookOpen },
    { path: '/lesson/classroom', label: 'Classroom', icon: PlayCircle },
    { path: '/tests', label: 'Tests', icon: FileCheck },
    { path: '/assignments', label: 'Assignments', icon: CheckSquare },
    { path: '/lesson/assessment', label: 'Assessment', icon: CheckCircle2 },
    { path: '/lesson/report', label: 'Report', icon: BarChart3 },
    { path: '/lesson/progress', label: 'Progress', icon: Compass },
  ];

  const isItemActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    if (path === '/lesson/create') {
      return (
        location.pathname.startsWith('/lesson/create') ||
        location.pathname.startsWith('/lesson/upload-topic') ||
        location.pathname.startsWith('/lesson/personalization') ||
        location.pathname.startsWith('/lesson/plan')
      );
    }
    if (path === '/lesson/classroom') {
      return (
        location.pathname.startsWith('/lesson/classroom') ||
        location.pathname.startsWith('/lesson/question') ||
        location.pathname.startsWith('/lesson/feedback')
      );
    }
    if (path === '/tests') {
      return location.pathname.startsWith('/tests');
    }
    if (path === '/assignments') {
      return location.pathname.startsWith('/assignments');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigate('/dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">AITeacher</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    STUDIO
                  </span>
                </div>

              </div>
            </button>

            {/* Teacher Badge */}
            <div className="hidden xl:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
              <div className="relative">
                <img
                  src={activeTeacher.avatar}
                  alt={activeTeacher.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400 text-[10px] block leading-tight">Teaching:</span>
                <span className="font-semibold text-slate-700">{activeTeacher.name}</span>
              </div>
            </div>
          </div>

          {/* Center Navigation Shortcuts */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${isActive
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Status & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/70 rounded-full text-xs font-bold text-amber-700">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{userProfile.streakDays}d</span>
            </div>

            {/* XP */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200/70 rounded-full text-xs font-bold text-indigo-700">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>{userProfile.xp} XP</span>
            </div>

            {/* Restart Demo Flow Button */}
            <button
              onClick={resetFlow}
              title="Reset to Dashboard"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
              />
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-semibold text-slate-800 leading-tight">{userProfile.name}</span>
                <span className="block text-[10px] text-slate-400 font-medium">AP Scholar</span>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
