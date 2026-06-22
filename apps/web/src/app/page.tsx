'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [names, setNames] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const playerNames = names.split('\n').map((n) => n.trim()).filter(Boolean);
    if (playerNames.length < 2) {
      setError('Se necesitan al menos 2 jugadores.');
      return;
    }
    setLoading(true);
    try {
      const game = await api.createGame({ playerNames });
      router.push(`/game/${game.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-500 tracking-wide">🐺 Lobos de la Aldea</h1>
          <p className="mt-2 text-gray-400 text-sm">Juego social de deducción</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Nombres de jugadores <span className="text-gray-500">(uno por línea)</span>
            </label>
            <textarea
              value={names}
              onChange={(e) => setNames(e.target.value)}
              rows={6}
              placeholder="Alice&#10;Bob&#10;Carol&#10;Dave&#10;Eve"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 focus:outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 rounded-lg font-bold text-lg transition-colors"
          >
            {loading ? 'Creando partida…' : 'Comenzar Partida'}
          </button>
        </form>
      </div>
    </main>
  );
}
