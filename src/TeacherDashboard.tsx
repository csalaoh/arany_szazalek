// @ts-nocheck
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { History, Check, X, LogOut, ArrowLeft, Clock } from 'lucide-react';

const SUPABASE_URL = "https://getxvumxgvcxmrawlbqz.supabase.co";
const SUPABASE_KEY = "sb_publishable_EziGCsRdBbu3iw0JK4DWzg_cNRPLQ7p";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function TeacherDashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [view, setView] = useState('list'); 
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: s } = await supabase.from('students').select('*').eq('role', 'student').order('name');
    const { data: r } = await supabase.from('practice_results').select('*').order('completed_at', { ascending: false });
    const { data: sess } = await supabase.from('student_sessions').select('*');
    setStudents(s || []); setResults(r || []); setSessions(sess || []);
  };

  const calculateStats = (data) => {
    if (data.length === 0) return { overall: 0, byTopic: {} };
    const correct = data.filter(d => d.is_correct).length;
    const overall = Math.round((correct / data.length) * 100);
    const byTopic = data.reduce((acc, curr) => {
      const t = curr.task_topic || 'vegyes';
      if (!acc[t]) acc[t] = { total: 0, correct: 0 };
      acc[t].total++;
      if (curr.is_correct) acc[t].correct++;
      return acc;
    }, {});
    return { overall, byTopic };
  };

  const getTime = (name) => {
    const mins = sessions.filter(s => s.student_name === name).reduce((a, c) => a + c.duration_minutes, 0);
    return mins < 60 ? `${mins}p` : `${Math.floor(mins/60)}ó ${mins%60}p`;
  };

  const topicNames = { 'ratio': 'Arány', 'proportion_division': 'Osztás', 'direct_proportion': 'Egyenes', 'inverse_proportion': 'Fordított', 'percentage': 'Százalék', 'vegyes': 'Vegyes' };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-2 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div className="text-left"><h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Vezérlő</h1><p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest tracking-tighter">Tanári Analitika</p></div>
          <div className="flex gap-2">
            <button onClick={() => setView('list')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${view === 'list' ? 'bg-indigo-600' : 'bg-slate-900 border border-slate-800'}`}>Tanulók</button>
            <button onClick={onLogout} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Kilépés</button>
          </div>
        </header>

        {view === 'list' && (
          <div className="space-y-4">
            {students.map((s) => (
              <div key={s.id} className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4 text-left">
                  <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${s.name}`} className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700" />
                  <div>
                    <div className="font-black uppercase text-white tracking-tight">{s.name}</div>
                    <div className="text-[10px] text-indigo-400 font-bold flex items-center gap-1"><Clock size={10}/> {getTime(s.name)}</div>
                  </div>
                </div>
                <button onClick={() => { setSelectedStudent(s.name); setView('detail'); }} className="bg-indigo-600 p-4 rounded-2xl text-white active:scale-90 transition-transform"><History size={24} /></button>
              </div>
            ))}
          </div>
        )}

        {view === 'detail' && selectedStudent && (
          <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
            <button onClick={() => setView('list')} className="text-slate-500 flex items-center gap-2 text-[10px] font-black uppercase mb-4"><ArrowLeft size={14}/> Vissza</button>
            {(() => {
              const res = results.filter(r => r.student_name === selectedStudent);
              const stats = calculateStats(res);
              return (
                <div className="space-y-4 text-left">
                  <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-indigo-500 flex items-center justify-between shadow-xl">
                    <div><h2 className="text-2xl font-black text-white uppercase italic">{selectedStudent}</h2><p className="text-indigo-400 font-bold text-[10px] uppercase">Összesített siker: {stats.overall}%</p></div>
                    <div className="text-right"><div className="text-slate-500 text-[8px] font-black uppercase">Összes idő</div><div className="text-white font-black text-sm">{getTime(selectedStudent)}</div></div>
                  </div>
                  
                  <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase mb-6 text-center">Témakörönkénti bontás</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(stats.byTopic).map(([topic, d]) => (
                        <div key={topic} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
                          <div className="flex justify-between items-center"><span className="text-[10px] font-black text-indigo-400 uppercase">{topicNames[topic] || topic}</span><span className="text-xs font-black">{Math.round((d.correct/d.total)*100)}%</span></div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${Math.round((d.correct/d.total)*100) > 70 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${Math.round((d.correct/d.total)*100)}%` }}></div></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-6 border border-slate-800 shadow-xl space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase text-center mb-4">Megoldási Napló</h3>
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                      {res.map((h, i) => (
                        <div key={i} className={`p-4 rounded-2xl border-2 ${h.is_correct ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                          <div className="flex justify-between items-center mb-2"><span className="text-[8px] font-black text-slate-500 uppercase bg-slate-950 px-2 py-1 rounded">{topicNames[h.task_topic]}</span>{h.is_correct ? <Check className="text-green-500" size={16} /> : <X className="text-red-500" size={16} />}</div>
                          <p className="text-xs font-bold mb-2 leading-tight">{h.task_question}</p>
                          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-between items-center text-[10px]"><span className="text-slate-500 font-bold uppercase">Válasz:</span><span className={`font-black uppercase ${h.is_correct ? 'text-green-400' : 'text-red-400'}`}>{h.student_answer}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}