'use client';
import axios from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PokemonListItem {
  name: string;
  url: string;
}

interface PokemonData {
  id: number;
  name: string;
  types: { type: { name: string } }[];
  sprites: {
    other: {
      "official-artwork": {
        front_default: string;
      };
    };
  };
}

interface TypeData {
  name: string;
  url: string;
}

export default function Home() {
  const [pokemons, setPokemons] = useState<PokemonData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<TypeData[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPokemons = async () => {
      setLoading(true);
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=300&offset=0`);
      const results: PokemonListItem[] = res.data.results;
      const pokemonDetails = await Promise.all(
        results.map(async (pokemon) => {
          const pokeRes = await axios.get(pokemon.url);
          return pokeRes.data;
        })
      );
      setPokemons(pokemonDetails);
      setOffset(300);
      setLoading(false);
    };
    fetchPokemons();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      const res = await axios.get("https://pokeapi.co/api/v2/type");
      setTypes(res.data.results.filter((t: TypeData) => t.name !== "unknown" && t.name !== "shadow"));
    };
    fetchTypes();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=20&offset=${offset}`);
    const results: PokemonListItem[] = res.data.results;
    const pokemonDetails = await Promise.all(
      results.map(async (pokemon) => {
        const pokeRes = await axios.get(pokemon.url);
        return pokeRes.data;
      })
    );
    setPokemons((prev) => [...prev, ...pokemonDetails]);
    setOffset(offset + 20);
    setLoadingMore(false);
  };

  const filteredPokemons = pokemons.filter((p) => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType
      ? p.types.some((t) => t.type.name === selectedType)
      : true;
    return matchName && matchType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a183d] to-[#1a2747] p-4 font-sans">
      <h1 className="text-5xl font-extrabold text-center mb-10 text-yellow-300 drop-shadow-lg tracking-widest glow-title">Pokémon</h1>
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10 items-center">
        <input
          type="text"
          placeholder="Search Pokémon..."
          className="border-none rounded-full px-6 py-3 w-full max-w-md shadow-lg bg-[#232b4a] text-white placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-300 outline-none text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border-none rounded-full px-6 py-3 shadow-lg bg-[#232b4a] text-white text-lg focus:ring-2 focus:ring-yellow-300 outline-none"
          value={selectedType}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedType(value);
            if (value) {
              router.push(`/type/${value}`);
            }
          }}
        >
          <option value="">All types</option>
          {types.map((type) => (
            <option key={type.name} value={type.name} className="capitalize">
              {type.name}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-center text-lg text-white">Loading data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
            {filteredPokemons.map((pokemon) => (
              <div
                key={pokemon.id}
                className="bg-[#19213a] rounded-3xl shadow-2xl p-6 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer border border-[#2e3a5e] relative group"
                onClick={() => router.push(`/pokemon/${pokemon.name}`)}
                style={{ boxShadow: '0 0 24px 0 #00eaff33, 0 2px 8px 0 #0008' }}
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1e2a4a] to-[#2e3a5e] flex items-center justify-center mb-3 shadow-inner border-4 border-[#2e3a5e] group-hover:shadow-[0_0_32px_8px_#00eaff99] transition">
                  <Image
                    src={pokemon.sprites.other["official-artwork"].front_default}
                    alt={pokemon.name}
                    width={120}
                    height={120}
                    className="drop-shadow-lg"
                  />
                </div>
                <div className="text-[#00eaff] text-xs font-mono absolute left-4 top-4 bg-[#10182a] px-3 py-1 rounded-full border border-[#2e3a5e] shadow">#{pokemon.id.toString().padStart(3, "0")}</div>
                <div className="capitalize font-bold text-2xl text-white mb-2 text-center drop-shadow">{pokemon.name}</div>
                <div className="flex gap-2 mt-2 flex-wrap justify-center">
                  {pokemon.types.map((t) => (
                    <Link
                      key={t.type.name}
                      href={`/type/${t.type.name}`}
                      className={
                        "text-xs px-3 py-1 rounded-full font-semibold shadow hover:underline hover:brightness-110 transition " +
                        (t.type.name === "grass"
                          ? "bg-lime-300 text-lime-900"
                          : t.type.name === "poison"
                          ? "bg-fuchsia-200 text-fuchsia-800"
                          : t.type.name === "fire"
                          ? "bg-orange-300 text-orange-900"
                          : t.type.name === "water"
                          ? "bg-blue-300 text-blue-900"
                          : t.type.name === "electric"
                          ? "bg-yellow-200 text-yellow-800"
                          : t.type.name === "bug"
                          ? "bg-green-200 text-green-800"
                          : t.type.name === "flying"
                          ? "bg-sky-200 text-sky-800"
                          : t.type.name === "psychic"
                          ? "bg-pink-200 text-pink-800"
                          : t.type.name === "rock"
                          ? "bg-yellow-800 text-yellow-100"
                          : t.type.name === "ground"
                          ? "bg-yellow-400 text-yellow-900"
                          : t.type.name === "fairy"
                          ? "bg-pink-100 text-pink-700"
                          : t.type.name === "dragon"
                          ? "bg-indigo-300 text-indigo-900"
                          : t.type.name === "ice"
                          ? "bg-cyan-100 text-cyan-800"
                          : t.type.name === "fighting"
                          ? "bg-red-800 text-red-100"
                          : t.type.name === "ghost"
                          ? "bg-purple-900 text-purple-100"
                          : t.type.name === "steel"
                          ? "bg-gray-400 text-gray-900"
                          : t.type.name === "dark"
                          ? "bg-gray-900 text-gray-100"
                          : "bg-gray-200 text-gray-800"
                        )
                      }
                      style={{ marginRight: 4 }}
                    >
                      type {t.type.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              className="bg-gradient-to-r from-yellow-300 to-yellow-500 text-[#19213a] font-bold px-8 py-3 rounded-full shadow-lg hover:from-yellow-400 hover:to-yellow-600 transition text-lg border-2 border-yellow-200"
              disabled={loadingMore}
            >
              {loadingMore ? "Loading more..." : "Load more"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
