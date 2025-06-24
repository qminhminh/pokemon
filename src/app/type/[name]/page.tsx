"use client";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface PokemonTypeItem {
  pokemon: {
    name: string;
    url: string;
  };
}

interface PokemonData {
  id: number;
  name: string;
  sprites: {
    other: {
      "official-artwork": {
        front_default: string;
      };
    };
  };
}

export default function TypePage() {
  const params = useParams();
  const router = useRouter();
  const typeName = params.name as string;
  const [pokemonList, setPokemonList] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<{ name: string }[]>([]);

  useEffect(() => {
    const fetchTypePokemons = async () => {
      setLoading(true);
      const res = await axios.get(`https://pokeapi.co/api/v2/type/${typeName}`);
      const pokemons: PokemonTypeItem[] = res.data.pokemon;
      // Lấy tối đa 30 Pokémon đầu tiên để tránh quá tải
      const details = await Promise.all(
        pokemons.slice(0, 30).map(async (p) => {
          try {
            const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${p.pokemon.name}`);
            return pokeRes.data;
          } catch {
            return null;
          }
        })
      );
      setPokemonList(details.filter(Boolean));
      setLoading(false);
    };
    fetchTypePokemons();
  }, [typeName]);

  useEffect(() => {
    // Lấy danh sách type cho dropdown
    const fetchTypes = async () => {
      const res = await axios.get("https://pokeapi.co/api/v2/type");
      setTypes(res.data.results.filter((t: any) => t.name !== "unknown" && t.name !== "shadow"));
    };
    fetchTypes();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a183d] to-[#1a2747] p-4 font-sans">
      <h1 className="text-4xl font-extrabold text-center mb-10 text-yellow-300 drop-shadow-lg tracking-widest">Pokémon of type "{typeName}"</h1>
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 items-center">
        <button
          onClick={() => router.push("/")}
          className="bg-gradient-to-r from-yellow-300 to-yellow-500 text-[#19213a] font-bold px-8 py-3 rounded-full shadow-lg hover:from-yellow-400 hover:to-yellow-600 transition text-lg border-2 border-yellow-200"
        >
          Back to Pokédex
        </button>
        <select
          className="border-none rounded-full px-6 py-3 shadow-lg bg-[#232b4a] text-white text-lg focus:ring-2 focus:ring-yellow-300 outline-none"
          value={typeName}
          onChange={(e) => {
            const value = e.target.value;
            if (value) {
              router.push(`/type/${value}`);
            } else {
              router.push(`/`);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
          {pokemonList.map((pokemon) => (
            <Link
              href={`/pokemon/${pokemon.name}`}
              key={pokemon.id}
              className="bg-[#19213a] rounded-3xl shadow-2xl p-6 flex flex-col items-center hover:scale-105 transition-transform cursor-pointer border border-[#2e3a5e] relative group"
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 