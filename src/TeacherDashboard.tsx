// @ts-nocheck
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  History,
  Check,
  X,
  LogOut,
  Key,
  BarChart3,
  Filter,
  PieChart,
  ArrowLeft,
  Users,
  Clock,
  LayoutGrid,
} from 'lucide-react';

const SUPABASE_URL = 'https://getxvumxgvcxmrawlbqz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EziGCsRdBbu3iw0JK4DWzg_cNRPLQ7p';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function TeacherDashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'student_detail', 'class_stats'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filterTopic, setFilterTopic] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: sData } = await supabase
      .from('students')
      .select('*')
      .eq('role', 'student')
      .order('name');
    const { data: rData } = await supabase
      .from('practice_results')
      .select('*')
      .order('completed_at', { ascending: false });
    const { data: sessData } = await supabase
      .from('student_sessions')
      .select('*');
    setStudents(sData || []);
    setResults(rData || []);
    setSessions(sessData || []);
  };

  const calculateStats = (data) => {
    if (data.length === 0) return { overall: 0, byTopic: {} };
    const correct = data.filter((d) => d.is_correct).length;
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

  const getTotalTime = (name) => {
    const mins = sessions
      .filter((s) => s.student_name === name)
      .reduce((acc, curr) => acc + curr.duration_minutes, 0);
    if (mins < 60) return `${mins} perc`;
    return `${Math.floor(mins / 60)} óra ${mins % 60} perc`;
  };

  const topicNames = {
    ratio: 'Arány',
    proportion_division: 'Arányos Osztás',
    direct_proportion: 'Egyenes Arányosság',
    inverse_proportion: 'Fordított Arányosság',
    percentage: 'Százalékszámítás',
    vegyes: 'Vegyes',
  };

  const classStats = calculateStats(results);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans text-left">
      <div className="max-w-6xl mx-auto">
        {/* FEJLÉC */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-slate-800 pb-8 gap-6">
          <div>
            <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
              Vezérlőközpont
            </h1>
            <p className="text-indigo-400 text-xs font-bold tracking-[0.4em] uppercase">
              Tanári Adminisztráció & Analitika
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'list'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              Tanulók
            </button>
            <button
              onClick={() => setView('class_stats')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                view === 'class_stats'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              Osztályátlag
            </button>
            <button
              onClick={onLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition-all ml-4 flex items-center gap-2"
            >
              <LogOut size={14} /> Kilépés
            </button>
          </div>
        </header>

        {/* OSZTÁLYSZINTŰ STATISZTIKA */}
        {view === 'class_stats' && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="bg-slate-900 p-10 rounded-[3.5rem] border border-indigo-500/30 flex flex-col items-center shadow-2xl">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10">
                Osztály Átlagos Teljesítménye
              </div>
              <div className="relative w-48 h-48 flex items-center justify-center mb-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="transparent"
                    className="text-slate-800"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={552}
                    strokeDashoffset={552 - (552 * classStats.overall) / 100}
                    className="text-indigo-500 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-5xl font-black text-white">
                  {classStats.overall}%
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {Object.entries(classStats.byTopic).map(([topic, d]) => {
                  const pct = Math.round((d.correct / d.total) * 100);
                  return (
                    <div
                      key={topic}
                      className="bg-slate-950 p-6 rounded-3xl border border-slate-800"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {topicNames[topic] || topic}
                        </span>
                        <span
                          className={`text-sm font-black ${
                            pct > 70
                              ? 'text-green-400'
                              : pct > 40
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            pct > 70
                              ? 'bg-green-500'
                              : pct > 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TANULÓI LISTA */}
        {view === 'list' && (
          <div className="bg-slate-900 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8">
            <table className="w-full text-left">
              <thead className="bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="px-10 py-8 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Név
                  </th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Idő
                  </th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase text-slate-500 text-center tracking-widest">
                    Besorolás
                  </th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase text-slate-500 text-right tracking-widest">
                    Elemzés
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-white">
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-indigo-600/5 transition-all group"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <img
                          src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${s.name}`}
                          className="w-12 h-12 bg-slate-800 rounded-2xl border border-slate-700 group-hover:border-indigo-500 transition-colors"
                        />
                        <span className="font-bold uppercase italic tracking-tight group-hover:text-indigo-400 transition-colors text-xl">
                          {s.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                        <Clock size={16} /> {getTotalTime(s.name)}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <select
                        value={s.group_level}
                        onChange={(e) => {
                          supabase
                            .from('students')
                            .update({ group_level: parseInt(e.target.value) })
                            .eq('id', s.id)
                            .then(() => fetchData());
                        }}
                        className="bg-slate-800 text-indigo-400 text-[10px] font-black p-3 rounded-xl border-none outline-none focus:ring-2 ring-indigo-500 uppercase tracking-widest"
                      >
                        <option value={1}>Inas (1)</option>
                        <option value={2}>Mester (2)</option>
                        <option value={3}>Professzor (3)</option>
                      </select>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedStudent(s.name);
                          setView('student_detail');
                        }}
                        className="bg-slate-800 hover:bg-indigo-600 p-4 rounded-2xl text-indigo-400 hover:text-white transition-all"
                      >
                        <History size={22} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EGYÉNI TANULÓI ANALITIKA (GRAFIKONOKKAL) */}
        {view === 'student_detail' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 text-left">
            {(() => {
              const sResults = results.filter(
                (r) => r.student_name === selectedStudent
              );
              const sStats = calculateStats(sResults);
              return (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Kördiagramos Kártya */}
                    <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-indigo-500 flex flex-col items-center justify-center text-center shadow-2xl">
                      <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="80"
                            cy="80"
                            r="74"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-slate-800"
                          />
                          <circle
                            cx="80"
                            cy="80"
                            r="74"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={465}
                            strokeDashoffset={
                              465 - (465 * sStats.overall) / 100
                            }
                            className="text-indigo-500 transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-4xl font-black text-white">
                          {sStats.overall}%
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase italic">
                        {selectedStudent}
                      </h2>
                      <div className="text-indigo-400 font-bold text-xs mt-2 mb-6 flex items-center gap-2">
                        <Clock size={14} /> {getTotalTime(selectedStudent)}
                      </div>
                      <button
                        onClick={() => setView('list')}
                        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <ArrowLeft size={14} /> Vissza
                      </button>
                    </div>

                    {/* Témakörönkénti Sávok */}
                    <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[3.5rem] border border-slate-800 shadow-2xl">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">
                        Témakörönkénti sikerráta
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(sStats.byTopic).map(([topic, d]) => {
                          const topicPct = Math.round(
                            (d.correct / d.total) * 100
                          );
                          return (
                            <div
                              key={topic}
                              className="bg-slate-950 p-5 rounded-3xl border border-slate-800"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                  {topicNames[topic] || topic}
                                </span>
                                <span className="text-xs font-black text-white">
                                  {topicPct}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    topicPct > 70
                                      ? 'bg-green-500'
                                      : topicPct > 40
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${topicPct}%` }}
                                ></div>
                              </div>
                              <p className="text-[8px] text-slate-600 font-bold uppercase mt-2 tracking-widest">
                                {d.total} feladat
                              </p>
                            </div>
                          );
                        })}
                        {Object.keys(sStats.byTopic).length === 0 && (
                          <div className="col-span-2 text-center py-10 text-slate-600 italic">
                            Még nincs adat a témakörökről.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Részletes Napló */}
                  <div className="bg-slate-900 rounded-[3.5rem] border border-slate-800 p-10 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Részletes Megoldási Napló
                      </h3>
                      <div className="flex items-center gap-3">
                        <Filter size={14} className="text-indigo-500" />
                        <select
                          onChange={(e) => setFilterTopic(e.target.value)}
                          className="bg-slate-800 text-[10px] font-black p-3 rounded-xl border-none outline-none text-indigo-400 uppercase tracking-widest"
                        >
                          <option value="all">Összes téma</option>
                          {Object.keys(sStats.byTopic).map((t) => (
                            <option key={t} value={t}>
                              {topicNames[t] || t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                      {sResults
                        .filter(
                          (h) =>
                            filterTopic === 'all' ||
                            h.task_topic === filterTopic
                        )
                        .map((h, i) => (
                          <div
                            key={i}
                            className={`p-6 rounded-[2rem] border-2 flex flex-col gap-4 ${
                              h.is_correct
                                ? 'bg-green-500/5 border-green-500/10'
                                : 'bg-red-500/5 border-red-500/10'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-500 uppercase px-3 py-1 bg-slate-950 rounded-full border border-slate-800">
                                {topicNames[h.task_topic] || h.task_topic} • Lv.{' '}
                                {h.task_difficulty}
                              </span>
                              <div className="flex items-center gap-4">
                                <span className="text-[9px] text-slate-600 font-bold uppercase">
                                  {new Date(h.completed_at).toLocaleString(
                                    'hu-HU'
                                  )}
                                </span>
                                {h.is_correct ? (
                                  <Check className="text-green-500" size={20} />
                                ) : (
                                  <X className="text-red-500" size={20} />
                                )}
                              </div>
                            </div>
                            <p className="text-md text-slate-200 font-bold leading-relaxed">
                              {h.task_question}
                            </p>
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                A diák válasza:
                              </span>
                              <span
                                className={`font-black uppercase tracking-widest text-lg ${
                                  h.is_correct
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {h.student_answer}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
