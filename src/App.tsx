// @ts-nocheck
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Lock, LogOut, Lightbulb, ArrowRight, LayoutGrid, 
  CheckCircle2, Trophy, TrendingDown, Target, Clock, ChevronRight
} from 'lucide-react';
import TeacherDashboard from './TeacherDashboard';

const SUPABASE_URL = "https://getxvumxgvcxmrawlbqz.supabase.co";
const SUPABASE_KEY = "sb_publishable_EziGCsRdBbu3iw0JK4DWzg_cNRPLQ7p";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [user, setUser] = useState(null);
  const [authStage, setAuthStage] = useState('login'); 
  const [selectedTopic, setSelectedTopic] = useState('vegyes');
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [confirmValue, setConfirmValue] = useState(null);
  const [feedback, setFeedback] = useState(null); 
  const [helpMode, setHelpMode] = useState(null);
  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [sessionStart, setSessionStart] = useState(null);

  const groupNames = { 1: "Inas", 2: "Mester", 3: "Professzor" };

  useEffect(() => {
    const savedUser = localStorage.getItem('mq6_user');
    const savedState = localStorage.getItem('mq6_state');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setSessionStart(new Date());
      if (savedState) {
        const s = JSON.parse(savedState);
        setScore(s.score || 0);
        setCurrentLevel(s.currentLevel || 1);
        setStreak(s.streak || 0);
        setAuthStage('theme_select');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mq6_user', JSON.stringify(user));
      localStorage.setItem('mq6_state', JSON.stringify({ score, currentLevel, streak }));
    }
  }, [user, score, currentLevel, streak]);

  const handleLogout = async () => {
    if (user && sessionStart) {
      const duration = Math.round((new Date() - sessionStart) / 60000);
      if (duration > 0) await supabase.from('student_sessions').insert([{ student_name: user.name, duration_minutes: duration }]);
    }
    localStorage.clear();
    setUser(null);
    setAuthStage('login');
  };

  const fetchTasks = async (lvl, top) => {
    let q = supabase.from('task').select('*').eq('difficulty', lvl);
    if (top !== 'vegyes') q = q.eq('topic', top);
    const { data } = await q;
    if (data && data.length > 0) {
      setTasks(data.sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
      setAuthStage('game');
    } else {
      alert("Ebben a témában ezen a szinten nincs több feladat. Válassz másikat!");
      setAuthStage('theme_select');
    }
  };

  const handleLogin = async () => {
    const { data, error: e } = await supabase.from('students').select('*').eq('name', loginName).eq('pin', loginPin).single();
    if (e || !data) { setError('Helytelen név vagy PIN!'); return; }
    setUser(data);
    setSessionStart(new Date());
    setAuthStage(data.is_first_login ? 'change_pin' : 'theme_select');
  };

  const submitAnswer = async () => {
    const t = tasks[currentIndex];
    const isCorrect = confirmValue === t.correct_answer;
    let newStreak = isCorrect ? (streak >= 0 ? streak + 1 : 1) : (streak <= 0 ? streak - 1 : -1);
    let nextLvl = currentLevel;
    let lvlChange = null;

    if (newStreak === 3 && currentLevel < 3) { nextLvl++; newStreak = 0; lvlChange = 'up'; }
    else if (newStreak === -3 && currentLevel > 1) { nextLvl--; newStreak = 0; lvlChange = 'down'; }

    setFeedback(isCorrect ? 'correct' : 'wrong');
    await supabase.from('practice_results').insert([{ 
      student_name: user.name, score: score + (isCorrect ? 10 : 0), level: currentLevel, task_id: t.id,
      task_question: t.question, task_topic: t.topic, task_difficulty: t.difficulty,
      is_correct: isCorrect, student_answer: confirmValue
    }]);

    setScore(s => s + (isCorrect ? 10 : 0));
    setStreak(newStreak);

    setTimeout(() => {
      setFeedback(null); setConfirmValue(null); setHelpMode(null);
      if (lvlChange) {
        setFeedback(lvlChange);
        setTimeout(() => { setFeedback(null); setCurrentLevel(nextLvl); fetchTasks(nextLvl, selectedTopic); }, 2000);
      } else {
        setCurrentIndex(i => (i + 1) % tasks.length);
      }
    }, 1200);
  };

  if (authStage === 'login') return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white font-sans text-center">
      <div className="bg-slate-900 p-10 rounded-[2.5rem] w-full max-w-sm border-t-4 border-indigo-600 shadow-2xl">
        <h1 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">Arány, százalék</h1>
        <div className="space-y-4">
          <input type="text" placeholder="Név" className="w-full p-4 bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-indigo-500 text-white" value={loginName} onChange={e => setLoginName(e.target.value)} />
          <input type="password" placeholder="PIN" className="w-full p-4 bg-slate-800 rounded-2xl text-center text-2xl tracking-widest outline-none focus:ring-2 ring-indigo-500 text-white" value={loginPin} onChange={e => setLoginPin(e.target.value)} />
          <button onClick={handleLogin} className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase">Belépés</button>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
        </div>
      </div>
    </div>
  );

  if (user?.role === 'teacher') return <TeacherDashboard onLogout={handleLogout} />;

  if (authStage === 'change_pin') return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-center">
      <div className="bg-slate-900 p-8 rounded-[2rem] border-2 border-orange-500 w-full max-w-sm">
        <h2 className="text-xl font-black mb-6 text-white uppercase">Új PIN kód</h2>
        <input type="password" placeholder="****" className="w-full p-4 bg-slate-800 rounded-2xl text-center text-3xl mb-6 outline-none text-white tracking-widest" value={newPin} onChange={e => setNewPin(e.target.value)} />
        <button onClick={async () => {
          if (newPin.length < 4) return;
          await supabase.from('students').update({ pin: newPin, is_first_login: false }).eq('id', user.id);
          setAuthStage('theme_select');
        }} className="w-full bg-orange-600 py-4 rounded-xl font-black text-white uppercase">Mentés</button>
      </div>
    </div>
  );

  if (authStage === 'theme_select') return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center font-sans">
      <h2 className="text-2xl font-black text-white mb-8 uppercase italic tracking-tighter">Válassz küldetést!</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {[{ id: 'vegyes', name: 'Vegyes', icon: '🌀' }, { id: 'ratio', name: 'Arány', icon: '⚖️' }, { id: 'proportion_division', name: 'Osztás', icon: '🍰' }, { id: 'direct_proportion', name: 'Egyenes', icon: '📈' }, { id: 'inverse_proportion', name: 'Fordított', icon: '📉' }, { id: 'percentage', name: 'Százalék', icon: '🎯' }].map(t => (
          <button key={t.id} onClick={() => { setSelectedTopic(t.id); fetchTasks(currentLevel, t.id); }} className="bg-slate-900 border-2 border-slate-800 p-6 rounded-3xl text-center group active:scale-95 transition-all">
            <div className="text-4xl mb-2">{t.icon}</div>
            <div className="text-white font-bold uppercase text-[10px] tracking-widest group-hover:text-indigo-400">{t.name}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const curT = tasks[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-2 md:p-8 flex flex-col items-center font-sans">
      <div className="w-full max-w-2xl flex justify-between items-center mb-4 bg-slate-900 p-4 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} className="w-10 h-10 bg-slate-800 rounded-xl" />
          <div className="text-left"><div className="font-black uppercase text-sm">{user.name}</div><div className="text-indigo-400 text-[8px] font-bold">{groupNames[currentLevel]}</div></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black text-indigo-400">{score}</div>
          <button onClick={() => setAuthStage('theme_select')} className="p-2 bg-slate-800 rounded-lg"><LayoutGrid size={18}/></button>
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500"><LogOut size={18}/></button>
        </div>
      </div>

      <div className="w-full max-w-xl bg-slate-900 rounded-[2.5rem] border border-slate-800 p-6 md:p-10 relative overflow-hidden shadow-2xl min-h-[420px] flex flex-col justify-center text-center">
        {feedback && (
          <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center animate-in fade-in ${feedback === 'correct' ? 'bg-green-600' : feedback === 'wrong' ? 'bg-red-600' : feedback === 'up' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
            <h2 className="text-3xl font-black uppercase text-white">{feedback === 'up' ? 'Szintlépés!' : feedback === 'down' ? 'Gyakorlás...' : feedback === 'correct' ? 'Helyes!' : 'Hiba!'}</h2>
          </div>
        )}
        {curT ? (
          <>
            <h2 className="text-lg md:text-2xl font-bold mb-8">{curT.question}</h2>
            <div className="grid grid-cols-1 gap-3">
              {curT.options.map(opt => <button key={opt} onClick={() => setConfirmValue(opt)} className={`py-4 rounded-2xl font-bold border-2 transition-all ${confirmValue === opt ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{opt}</button>)}
            </div>
            <div className="flex gap-4 mt-8 pt-4 border-t border-slate-800 justify-around">
              <button onClick={() => setHelpMode('guidance')} className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><Lightbulb size={16}/> Rávezetés</button>
              <button onClick={() => setHelpMode('step')} className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><ArrowRight size={16}/> Megoldás</button>
            </div>
            {helpMode && <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs italic">{helpMode === 'guidance' ? curT.guidance_question : curT.next_step}</div>}
          </>
        ) : <div className="font-bold animate-pulse">Feladatok betöltése...</div>}
      </div>

      {confirmValue && !feedback && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-indigo-600 p-8 rounded-[2rem] text-center max-w-xs w-full shadow-2xl">
            <h3 className="text-xl font-black mb-8 uppercase italic">Végleges válasz?</h3>
            <div className="flex gap-3">
              <button onClick={() => setConfirmValue(null)} className="flex-1 py-4 bg-slate-800 rounded-xl font-black text-slate-400 uppercase text-xs">Mégse</button>
              <button onClick={submitAnswer} className="flex-1 py-4 bg-indigo-600 rounded-xl font-black text-white uppercase text-xs shadow-lg">Mehet!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}