// @ts-nocheck
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Lock,
  User as UserIcon,
  LogOut,
  Star,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  LayoutGrid,
  CheckCircle2,
  Trophy,
  TrendingDown,
  Target,
  Clock,
} from 'lucide-react';
import TeacherDashboard from './TeacherDashboard';

const SUPABASE_URL = 'https://getxvumxgvcxmrawlbqz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EziGCsRdBbu3iw0JK4DWzg_cNRPLQ7p';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authStage, setAuthStage] = useState('login');
  const [selectedTopic, setSelectedTopic] = useState('vegyes');
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [confirmValue, setConfirmValue] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [helpMode, setHelpMode] = useState(null); // null, 'guidance', 'step'
  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [sessionStart, setSessionStart] = useState(null);

  const groupNames = { 1: 'Inas', 2: 'Mester', 3: 'Professzor' };

  useEffect(() => {
    const savedUser = localStorage.getItem('mq6_user');
    const savedState = localStorage.getItem('mq6_state');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setSessionStart(new Date());
      if (savedState) {
        const state = JSON.parse(savedState);
        setScore(state.score || 0);
        setCurrentLevel(state.currentLevel || 1);
        setStreak(state.streak || 0);
        setAuthStage('theme_select');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mq6_user', JSON.stringify(user));
      localStorage.setItem(
        'mq6_state',
        JSON.stringify({ score, currentLevel, streak })
      );
    }
  }, [user, score, currentLevel, streak]);

  const handleLogout = async () => {
    if (user && sessionStart) {
      const durationMinutes = Math.round((new Date() - sessionStart) / 60000);
      if (durationMinutes > 0) {
        await supabase
          .from('student_sessions')
          .insert([
            { student_name: user.name, duration_minutes: durationMinutes },
          ]);
      }
    }
    localStorage.clear();
    setUser(null);
    setAuthStage('login');
  };

  const fetchTasks = async (level, topic) => {
    setLoading(true);
    let query = supabase.from('task').select('*').eq('difficulty', level);
    if (topic !== 'vegyes') query = query.eq('topic', topic);
    const { data } = await query;
    if (data && data.length > 0) {
      setTasks(data.sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
      setAuthStage('game');
    } else {
      alert(`Ebben a témakörben elfogytak a feladatok ezen a szinten!`);
      setAuthStage('theme_select');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    const { data, error: authError } = await supabase
      .from('students')
      .select('*')
      .eq('name', loginName)
      .eq('pin', loginPin)
      .single();
    if (authError || !data) {
      setError('Helytelen adatok!');
      return;
    }
    setUser(data);
    setSessionStart(new Date());
    setAuthStage(data.is_first_login ? 'change_pin' : 'theme_select');
  };

  const submitAnswer = async () => {
    const task = tasks[currentIndex];
    const isCorrect = confirmValue === task.correct_answer;
    let newStreak = isCorrect
      ? streak >= 0
        ? streak + 1
        : 1
      : streak <= 0
      ? streak - 1
      : -1;
    let nextLvl = currentLevel;
    let levelChange = null;

    if (newStreak === 3 && currentLevel < 3) {
      nextLvl++;
      newStreak = 0;
      levelChange = 'up';
    } else if (newStreak === -3 && currentLevel > 1) {
      nextLvl--;
      newStreak = 0;
      levelChange = 'down';
    }

    setFeedback(isCorrect ? 'correct' : 'wrong');
    await supabase.from('practice_results').insert([
      {
        student_name: user.name,
        score: score + (isCorrect ? 10 : 0),
        level: currentLevel,
        task_id: task.id,
        task_question: task.question,
        task_topic: task.topic,
        task_difficulty: task.difficulty,
        is_correct: isCorrect,
        student_answer: confirmValue,
      },
    ]);

    setScore((s) => s + (isCorrect ? 10 : 0));
    setStreak(newStreak);

    setTimeout(() => {
      setFeedback(null);
      setConfirmValue(null);
      setHelpMode(null);
      if (levelChange) {
        setFeedback(levelChange);
        setTimeout(() => {
          setFeedback(null);
          setCurrentLevel(nextLvl);
          fetchTasks(nextLvl, selectedTopic);
        }, 2000);
      } else {
        setCurrentIndex((i) => (i + 1) % tasks.length);
      }
    }, 1200);
  };

  if (authStage === 'login')
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
        <div className="bg-slate-900 p-10 rounded-[2.5rem] w-full max-w-sm border-t-4 border-indigo-600 shadow-2xl">
          <h1 className="text-3xl font-black mb-8 italic uppercase tracking-tighter text-center">
            MathQuest 6
          </h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Név"
              className="w-full p-4 bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-indigo-500 text-white"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
            />
            <input
              type="password"
              placeholder="PIN"
              className="w-full p-4 bg-slate-800 rounded-2xl text-center text-2xl tracking-widest outline-none focus:ring-2 ring-indigo-500 text-white"
              value={loginPin}
              onChange={(e) => setLoginPin(e.target.value)}
            />
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase shadow-lg"
            >
              Belépés
            </button>
            {error && (
              <p className="text-red-500 text-center font-bold text-xs">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    );

  if (user?.role === 'teacher')
    return <TeacherDashboard onLogout={handleLogout} />;

  if (authStage === 'theme_select')
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center font-sans">
        <h2 className="text-2xl font-black text-white mb-8 uppercase italic tracking-tighter">
          Küldetés választása
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
          {[
            { id: 'vegyes', name: 'Vegyes', icon: '🌀' },
            { id: 'ratio', name: 'Arány', icon: '⚖️' },
            { id: 'proportion_division', name: 'Osztás', icon: '🍰' },
            { id: 'direct_proportion', name: 'Egyenes', icon: '📈' },
            { id: 'inverse_proportion', name: 'Fordított', icon: '📉' },
            { id: 'percentage', name: 'Százalék', icon: '🎯' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTopic(t.id);
                fetchTasks(currentLevel, t.id);
              }}
              className="bg-slate-900 border-2 border-slate-800 p-6 rounded-3xl text-center group active:scale-95 transition-all"
            >
              <div className="text-4xl mb-2">{t.icon}</div>
              <div className="text-white font-bold uppercase text-[10px] tracking-widest group-hover:text-indigo-400">
                {t.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    );

  const currentTask = tasks[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 flex flex-col items-center font-sans">
      {/* HUD */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 bg-slate-900 p-4 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`}
            className="w-12 h-12 bg-slate-800 rounded-xl"
          />
          <div className="text-left leading-tight">
            <div className="font-black uppercase text-sm">{user.name}</div>
            <div className="text-indigo-400 text-[10px] font-bold">
              {groupNames[currentLevel]}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-black text-indigo-400 tabular-nums">
              {score}
            </div>
          </div>
          <button
            onClick={() => setAuthStage('theme_select')}
            className="text-slate-500 hover:text-white"
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-500"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* GAME CARD */}
      <div className="w-full max-w-xl bg-slate-900 rounded-[3rem] border border-slate-800 p-8 relative overflow-hidden shadow-2xl min-h-[420px] flex flex-col justify-center text-center">
        {feedback && (
          <div
            className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${
              feedback === 'correct'
                ? 'bg-green-600/90'
                : feedback === 'wrong'
                ? 'bg-red-600/90'
                : feedback === 'up'
                ? 'bg-indigo-600'
                : 'bg-slate-800'
            }`}
          >
            <h2 className="text-4xl font-black uppercase text-white tracking-widest">
              {feedback === 'up'
                ? 'Szintlépés!'
                : feedback === 'down'
                ? 'Gyakoroljunk!'
                : feedback === 'correct'
                ? 'Helyes!'
                : 'Hiba!'}
            </h2>
          </div>
        )}

        {currentTask ? (
          <>
            <h2 className="text-xl md:text-2xl font-bold mb-8 text-white">
              {currentTask.question}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {currentTask.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setConfirmValue(opt)}
                  className={`py-5 rounded-2xl font-bold text-lg border-2 transition-all ${
                    confirmValue === opt
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* SEGÍTSÉG SZEKCIÓ */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-800 justify-around">
              <button
                onClick={() =>
                  setHelpMode(helpMode === 'guidance' ? null : 'guidance')
                }
                className={`text-[10px] font-black uppercase flex items-center gap-2 transition-colors ${
                  helpMode === 'guidance' ? 'text-yellow-400' : 'text-slate-500'
                }`}
              >
                <Lightbulb size={16} /> Rávezetés
              </button>
              <button
                onClick={() => setHelpMode(helpMode === 'step' ? null : 'step')}
                className={`text-[10px] font-black uppercase flex items-center gap-2 transition-colors ${
                  helpMode === 'step' ? 'text-indigo-400' : 'text-slate-500'
                }`}
              >
                <ArrowRight size={16} /> Megoldás
              </button>
            </div>

            {helpMode && (
              <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-100 text-sm italic animate-in slide-in-from-top-2">
                {helpMode === 'guidance'
                  ? currentTask.guidance_question || 'Gondold át a tanultakat!'
                  : currentTask.next_step || 'Próbáld meg felírni az adatokat!'}
              </div>
            )}
          </>
        ) : (
          <div className="text-center font-bold">Feladatok betöltése...</div>
        )}
      </div>

      {/* CONFIRM MODAL */}
      {confirmValue && !feedback && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-indigo-600 p-10 rounded-[2.5rem] text-center max-w-xs w-full shadow-2xl">
            <h3 className="text-2xl font-black mb-8 text-white uppercase italic">
              Biztos vagy benne?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmValue(null)}
                className="flex-1 py-4 bg-slate-800 rounded-xl font-black text-slate-400 uppercase text-xs"
              >
                Mégse
              </button>
              <button
                onClick={submitAnswer}
                className="flex-1 py-4 bg-indigo-600 rounded-xl font-black text-white uppercase text-xs shadow-lg"
              >
                Mehet!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
