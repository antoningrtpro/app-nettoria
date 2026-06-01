'use client';

import { useState, useEffect, useRef } from 'react';

interface Suggestion {
  display_name: string;
  place_id: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function AddressAutocomplete({ value, onChange, error }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = async (q: string) => {
    if (q.length < 4) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&countrycodes=fr`,
        { headers: { 'User-Agent': 'NETTORIA-Pricing/1.0' } }
      );
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (v: string) => {
    setQuery(v);
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 350);
  };

  const select = (s: Suggestion) => {
    setQuery(s.display_name);
    onChange(s.display_name);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="12 rue de la Paix, 75001 Paris"
          className={`w-full border rounded-xl px-4 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-colors bg-white pr-10 ${
            error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gray-900'
          }`}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin block" />
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => select(s)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 leading-snug"
              >
                {s.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
}
