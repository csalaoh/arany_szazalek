// @ts-nocheck
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('URL', 'KEY');

export default function Teacher() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    // Itt később a tanulók eredményeit fogjuk lekérni a 'practice_results' táblából
    // Egyelőre csak a feladatok eloszlását nézzük
  }, []);

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Tanári Vezérlőpult</h1>
      <div className="bg-white p-6 rounded-xl shadow">
        <p>Hamarosan itt látod majd a diákok előrehaladását!</p>
        <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
          Adatok frissítése
        </button>
      </div>
    </div>
  );
}
