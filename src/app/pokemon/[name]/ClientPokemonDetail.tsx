"use client";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string } }[];
  height: number;
  weight: number;
}

interface SpeciesData {
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  varieties: any[];
}

interface MoveData {
  move: { name: string };
}

interface EvolutionChainData {
  chain: {
    species: { name: string };
    evolves_to: any[];
  };
}

interface AbilityDetail {
  name: string;
  effect_entries: { effect: string; language: { name: string } }[];
}

export interface ClientPokemonDetailProps {
  name: string;
}

export default function ClientPokemonDetail({ name }: ClientPokemonDetailProps) {
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [species, setSpecies] = useState<SpeciesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [moves, setMoves] = useState<MoveData[]>([]);
  const [evolution, setEvolution] = useState<string[]>([]);
  const [abilitiesDetail, setAbilitiesDetail] = useState<AbilityDetail[]>([]);
  const [relatedPokemons, setRelatedPokemons] = useState<any[]>([]);
  const [relatedPokemonsFull, setRelatedPokemonsFull] = useState<any[]>([]);
  const [evoIdMap, setEvoIdMap] = useState<{ [name: string]: number }>({});
  const [relatedIdMap, setRelatedIdMap] = useState<{ [name: string]: number }>({});
  const [forms, setForms] = useState<any[]>([]);
  const [formsData, setFormsData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFormError, setShowFormError] = useState<number | null>(null);
  const [types, setTypes] = useState<any[]>([]);
  const [selectedRelatedType, setSelectedRelatedType] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`);
        setPokemon(pokeRes.data);
        setMoves(pokeRes.data.moves.slice(0, 10));
        const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${name}`);
        setSpecies(speciesRes.data);
        // Lấy forms/varieties
        if (speciesRes.data.varieties) {
          setForms(speciesRes.data.varieties);
          const formDetails = await Promise.all(
            speciesRes.data.varieties.map(async (v: any) => {
              try {
                const res = await axios.get(v.pokemon.url);
                return res.data;
              } catch {
                return null;
              }
            })
          );
          setFormsData(formDetails);
        }
        // Evolution chain
        if (speciesRes.data.evolution_chain?.url) {
          const evoRes = await axios.get(speciesRes.data.evolution_chain.url);
          const evoNames: string[] = [];
          function traverse(chain: any) {
            evoNames.push(chain.species.name);
            if (chain.evolves_to.length > 0) {
              chain.evolves_to.forEach(traverse);
            }
          }
          traverse(evoRes.data.chain);
          setEvolution(evoNames);
          const evoIdObj: { [name: string]: number } = {};
          await Promise.all(
            evoNames.map(async (evoName) => {
              try {
                const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${evoName}`);
                evoIdObj[evoName] = res.data.id;
              } catch {}
            })
          );
          setEvoIdMap(evoIdObj);
        }
        // Abilities detail
        const abilities = pokeRes.data.abilities;
        const abilityDetails = await Promise.all(
          abilities.map(async (a: any) => {
            const abRes = await axios.get(a.ability.url);
            return abRes.data;
          })
        );
        setAbilitiesDetail(abilityDetails);
        // Related pokemons by type
        if (pokeRes.data.types.length > 0) {
          const typeName = pokeRes.data.types[0].type.name;
          const typeRes = await axios.get(`https://pokeapi.co/api/v2/type/${typeName}`);
          setRelatedPokemons(typeRes.data.pokemon.slice(0, 10));
          const relatedIdObj: { [name: string]: number } = {};
          const fullDetails = await Promise.all(
            typeRes.data.pokemon.slice(0, 10).map(async (p: any) => {
              try {
                const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${p.pokemon.name}`);
                relatedIdObj[p.pokemon.name] = res.data.id;
                return res.data;
              } catch {
                return null;
              }
            })
          );
          setRelatedPokemonsFull(fullDetails.filter(Boolean));
          setRelatedIdMap(relatedIdObj);
        }
        setLoading(false);
      } catch (err) {
        setError('No data found for this Pokémon!');
        setPokemon(null);
        setSpecies(null);
        setLoading(false);
      }
    };
    fetchData();
  }, [name]);

  useEffect(() => {
    const fetchTypes = async () => {
      const res = await axios.get("https://pokeapi.co/api/v2/type");
      setTypes(res.data.results.filter((t: any) => t.name !== "unknown" && t.name !== "shadow"));
    };
    fetchTypes();
  }, []);

  if (error) {
    // Tìm form phù hợp trong formsData
    const formFallback = formsData.find(
      (f) => f && (f.id.toString() === name || f.name === name)
    );
    if (formFallback) {
      return (
        <div className="flex flex-col items-center mt-20">
          <div className="relative w-48 h-48 flex items-center justify-center mb-4">
            <Image
              src={formFallback.sprites.other["official-artwork"].front_default}
              alt={formFallback.name}
              width={180}
              height={180}
              className="drop-shadow-lg"
            />
          </div>
          <div className="capitalize font-bold text-2xl text-white mb-2 text-center drop-shadow">{formFallback.name.replace(/-/g, ' ')}</div>
          <div className="text-red-400 text-lg mb-4">No data found for this Pokémon!</div>
          <Link href="/" className="text-blue-400 underline">Back to Pokémon</Link>
        </div>
      );
    }
    // Nếu không có form phù hợp, hiển thị lỗi như cũ
    return (
      <div className="text-center mt-20 text-lg text-red-400">
        No data found for this Pokémon!
        <div>
          <Link href="/" className="text-blue-400 underline ml-2">Back to Pokémon</Link>
        </div>
      </div>
    );
  }

  if (loading || !pokemon || !species) {
    return <div className="text-center mt-20 text-lg">Đang tải dữ liệu...</div>;
  }

  const flavor = species.flavor_text_entries.find((f: any) => f.language.name === "en")?.flavor_text.replace(/\f|\n/g, " ") || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a183d] to-[#1a2747] p-2 sm:p-4 font-sans text-white">
      <div className="w-full flex justify-center mb-4">
        <Link href="/" className="bg-gradient-to-r from-yellow-300 to-yellow-500 text-[#19213a] font-bold px-8 py-3 rounded-full shadow-lg hover:from-yellow-400 hover:to-yellow-600 transition text-lg border-2 border-yellow-200">
          Back to Pokémon
        </Link>
      </div>
      <div className="max-w-5xl w-full mx-auto bg-[#19213a] rounded-2xl sm:rounded-3xl shadow-2xl p-2 sm:p-4 md:p-8 mt-4 sm:mt-8 border border-[#2e3a5e] relative flex flex-col gap-4 sm:gap-8">
        {/* Header: Tên, số, ảnh lớn */}
        <div className="flex flex-col gap-4 sm:gap-8 items-center md:items-start md:flex-row md:gap-8">
          {/* Cột trái: Hệ, nhược điểm */}
          <div className="flex flex-col gap-4 sm:gap-6 w-full md:w-1/4 items-center md:items-start">
            <div>
              <div className="text-base sm:text-lg font-bold mb-1 sm:mb-2 text-lime-200">Type</div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {pokemon.types.map((t) => (
                  <Link
                    key={t.type.name}
                    href={`/type/${t.type.name}`}
                    className={
                      "text-sm px-4 py-1 rounded-full font-bold shadow flex items-center justify-center w-fit hover:underline hover:brightness-110 transition " +
                      (t.type.name === "grass"
                        ? "bg-lime-300 text-lime-900 border-lime-400 border-2"
                        : t.type.name === "poison"
                        ? "bg-fuchsia-200 text-fuchsia-800 border-fuchsia-400 border-2"
                        : t.type.name === "fire"
                        ? "bg-orange-300 text-orange-900 border-orange-400 border-2"
                        : t.type.name === "water"
                        ? "bg-blue-300 text-blue-900 border-blue-400 border-2"
                        : t.type.name === "electric"
                        ? "bg-yellow-200 text-yellow-800 border-yellow-400 border-2"
                        : t.type.name === "bug"
                        ? "bg-green-200 text-green-800 border-green-400 border-2"
                        : t.type.name === "flying"
                        ? "bg-sky-200 text-sky-800 border-sky-400 border-2"
                        : t.type.name === "psychic"
                        ? "bg-pink-200 text-pink-800 border-pink-400 border-2"
                        : t.type.name === "rock"
                        ? "bg-yellow-800 text-yellow-100 border-yellow-400 border-2"
                        : t.type.name === "ground"
                        ? "bg-yellow-400 text-yellow-900 border-yellow-600 border-2"
                        : t.type.name === "fairy"
                        ? "bg-pink-100 text-pink-700 border-pink-300 border-2"
                        : t.type.name === "dragon"
                        ? "bg-indigo-300 text-indigo-900 border-indigo-400 border-2"
                        : t.type.name === "ice"
                        ? "bg-cyan-100 text-cyan-800 border-cyan-400 border-2"
                        : t.type.name === "fighting"
                        ? "bg-red-800 text-red-100 border-red-400 border-2"
                        : t.type.name === "ghost"
                        ? "bg-purple-900 text-purple-100 border-purple-400 border-2"
                        : t.type.name === "steel"
                        ? "bg-gray-400 text-gray-900 border-gray-500 border-2"
                        : t.type.name === "dark"
                        ? "bg-gray-900 text-gray-100 border-gray-400 border-2"
                        : "bg-gray-200 text-gray-800 border-gray-400 border-2"
                      )
                    }
                  >
                    type {t.type.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold mb-1 sm:mb-2 text-pink-200">Weakness</div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <span className="bg-orange-400 text-white px-4 py-1 rounded-full font-bold">type Fire</span>
                <span className="bg-cyan-300 text-blue-900 px-4 py-1 rounded-full font-bold">type Ice</span>
                <span className="bg-sky-300 text-sky-900 px-4 py-1 rounded-full font-bold">type Flying</span>
                <span className="bg-pink-300 text-pink-900 px-4 py-1 rounded-full font-bold">type Psychic</span>
              </div>
            </div>
          </div>
          {/* Cột giữa: Ảnh lớn, tên */}
          <div className="flex flex-col items-center w-full md:w-2/4 mt-2 md:mt-0">
            <div className="relative flex flex-col items-center justify-center mb-2 sm:mb-4">
              <div className="absolute z-0 w-full h-full flex items-center justify-center">
                <div className="w-full h-full rounded-full animate-glow bg-cyan-400/30 blur-2xl" />
              </div>
              <div className="w-72 h-72 rounded-full bg-gradient-to-br from-[#1e2a4a] to-[#2e3a5e] flex items-center justify-center shadow-inner border-8 border-[#2e3a5e] relative" style={{ boxShadow: '0 0 64px 0 #00eaff77, 0 2px 8px 0 #0008' }}>
                <Image
                  src={pokemon.sprites.other["official-artwork"].front_default}
                  alt={pokemon.name}
                  width={260}
                  height={260}
                  quality={100}
                  className="drop-shadow-2xl shadow-xl object-contain transition-transform duration-500 ease-out animate-fadein hover:scale-110 animate-swing-horizontal"
                />
              </div>
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 capitalize font-extrabold text-xl xs:text-2xl sm:text-4xl text-white drop-shadow-lg tracking-widest text-center">{pokemon.name}</div>
            </div>
          </div>
          {/* Cột phải: Thông tin chi tiết */}
          <div className="flex flex-col gap-2 sm:gap-4 w-full md:w-1/4 items-center md:items-end mt-2 md:mt-0">
            <div className="bg-[#232b4a] rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-lg border border-[#2e3a5e] w-full">
              <div className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-yellow-200">Information</div>
              <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2 text-xs xs:text-sm sm:text-base">
                <div>Height:</div>
                <div>{pokemon.height / 10} m</div>
                <div>Weight:</div>
                <div>{pokemon.weight / 10} kg</div>
                <div>Category:</div>
                <div>Seed Pokémon</div>
                <div>Gender:</div>
                <div className="flex gap-2 items-center">
                  <span className="text-blue-400">♂</span>
                  <span className="text-pink-400">♀</span>
                </div>
                <div>Ability:</div>
                <div>Overgrow <span className="ml-1">🌱</span></div>
              </div>
            </div>
          </div>
        </div>
        {/* Dưới: Mô tả, năng lực, tiến hóa */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-8 mt-4 sm:mt-8">
          {/* Mô tả/phiên bản */}
          <div className="bg-[#232b4a] rounded-xl sm:rounded-2xl p-2 xs:p-3 sm:p-6 shadow-lg border border-[#2e3a5e] flex-1 min-w-[120px] xs:min-w-[180px] sm:min-w-[250px]">
            <div className="font-bold text-base sm:text-lg mb-1 sm:mb-2 text-yellow-200 flex items-center gap-2">Version <span>🕹️</span></div>
            <div className="italic text-gray-200 text-xs xs:text-sm sm:text-base">{flavor}</div>
          </div>
          {/* Năng lực (bar chart) */}
          <div className="bg-[#232b4a] rounded-xl sm:rounded-2xl p-2 xs:p-3 sm:p-6 shadow-lg border border-[#2e3a5e] flex-1 min-w-[120px] xs:min-w-[180px] sm:min-w-[250px]">
            <div className="font-bold text-base sm:text-lg mb-2 sm:mb-4 text-yellow-200">Stats</div>
            <div className="flex flex-col gap-1 sm:gap-2">
              {pokemon.stats.map((s) => (
                <div key={s.stat.name} className="flex items-center gap-1 sm:gap-2">
                  <span className="capitalize w-12 xs:w-16 sm:w-24 inline-block text-xs xs:text-sm sm:text-base">{s.stat.name}</span>
                  <div className="flex-1 h-2 xs:h-3 sm:h-4 bg-[#10182a] rounded-full overflow-hidden">
                    <div className="h-2 xs:h-3 sm:h-4 rounded-full" style={{ width: `${Math.min(s.base_stat, 100)}%`, background: '#00eaff' }}></div>
                  </div>
                  <span className="font-mono w-5 xs:w-6 sm:w-8 text-right text-xs xs:text-sm sm:text-base">{s.base_stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Chuỗi tiến hóa ngang */}
        <div className="mt-4 sm:mt-10 bg-[#232b4a] rounded-xl sm:rounded-2xl p-2 xs:p-3 sm:p-6 shadow-lg border border-[#2e3a5e]">
          <div className="font-bold text-base sm:text-lg mb-2 sm:mb-4 text-yellow-200">Evolution</div>
          <div className="flex flex-row gap-2 xs:gap-4 sm:gap-6 items-center justify-center flex-wrap">
            {evolution.map((evo, idx) => (
              <div key={evo} className="flex flex-col items-center">
                <Link href={`/pokemon/${evo}`} className="hover:underline">
                  <div className="w-40 h-40 rounded-2xl bg-[#10182a] flex items-center justify-center mb-2 border-4 border-[#2e3a5e] shadow-lg">
                    <Image
                      src={evoIdMap[evo] ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evoIdMap[evo]}.png` : "/favicon.ico"}
                      alt={evo}
                      width={150}
                      height={150}
                      className="transition-transform duration-500 ease-out animate-fadein hover:scale-110"
                    />
                  </div>
                  <div className="text-[#00eaff] text-xs font-mono bg-[#10182a] px-2 py-1 rounded-full border border-[#2e3a5e] shadow mb-1">#{evoIdMap[evo]?.toString().padStart(3, "0")}</div>
                  <div className="capitalize font-bold text-base text-white mb-1 text-center drop-shadow">{evo}</div>
                  <div className="flex gap-1 flex-wrap justify-center">
                    {evoIdMap[evo] && (
                      <></>
                    )}
                  </div>
                </Link>
                {idx < evolution.length - 1 && (
                  <span className="mx-2 text-3xl text-yellow-300">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {formsData && formsData.length > 1 && (
          <div className="mb-4 sm:mb-8">
            <div className="font-bold text-base xs:text-lg sm:text-xl mb-2 sm:mb-4 text-cyan-200">Forms</div>
            <div className="flex flex-wrap gap-2 xs:gap-3 sm:gap-6 justify-center">
              {formsData.map((form, idx) =>
                form ? (
                  <div key={form.id} className="bg-[#10182a] rounded-3xl border-2 border-cyan-400 shadow-lg p-4 flex flex-col items-center w-56 hover:scale-105 transition">
                    <div className="relative w-40 h-40 flex items-center justify-center mb-2">
                      <Image
                        src={form.sprites.other["official-artwork"].front_default}
                        alt={form.name}
                        width={150}
                        height={150}
                        className="drop-shadow-lg transition-transform duration-500 ease-out animate-fadein hover:scale-110 animate-swing-horizontal"
                      />
                    </div>
                    <div className="capitalize font-bold text-lg text-white mb-1 text-center drop-shadow">{form.name.replace(/-/g, ' ')}</div>
                    <div className="text-[#00eaff] text-xs font-mono bg-[#10182a] bg-opacity-80 px-2 py-0 rounded-full border border-[#2e3a5e] shadow mb-1 inline-block min-w-[36px] text-center">
                      {form.id.toString().padStart(4, "0")}
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap justify-center">
                      {form.types.map((t: any) => (
                        <span
                          key={t.type.name}
                          className={
                            "text-xs px-3 py-1 rounded-full font-semibold shadow " +
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
                        >
                          type {t.type.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    key={idx}
                    className="bg-[#222] rounded-3xl border-2 border-gray-600 shadow-lg p-4 flex flex-col items-center w-56 opacity-50 relative"
                  >
                    <div className="w-32 h-32 flex items-center justify-center mb-2">
                      <span className="text-gray-400">No data found</span>
                    </div>
                    <div className="capitalize font-bold text-lg text-gray-400 mb-1 text-center drop-shadow">No data found</div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
        {/* Danh sách Pokémon liên quan */}
        {relatedPokemonsFull && relatedPokemonsFull.length > 0 && (
          <div className="mt-10 bg-[#232b4a] rounded-2xl p-6 shadow-lg border border-[#2e3a5e]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div className="font-bold text-lg text-cyan-200">Related Pokémon</div>
              <select
                className="border-none rounded-full px-6 py-3 shadow-lg bg-[#19213a] text-white text-lg focus:ring-2 focus:ring-yellow-300 outline-none w-full sm:w-auto"
                value={selectedRelatedType}
                onChange={async e => {
                  const value = e.target.value;
                  setSelectedRelatedType(value);
                  if (!value) {
                    // Nếu chọn All types, lấy lại danh sách theo type đầu tiên của Pokémon hiện tại
                    if (pokemon && pokemon.types.length > 0) {
                      const typeName = pokemon.types[0].type.name;
                      const typeRes = await axios.get(`https://pokeapi.co/api/v2/type/${typeName}`);
                      const fullDetails = await Promise.all(
                        typeRes.data.pokemon.slice(0, 10).map(async (p: any) => {
                          try {
                            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${p.pokemon.name}`);
                            return res.data;
                          } catch {
                            return null;
                          }
                        })
                      );
                      setRelatedPokemonsFull(fullDetails.filter(Boolean));
                    }
                  } else {
                    // Nếu chọn type khác, gọi API lấy danh sách theo type đó
                    const typeRes = await axios.get(`https://pokeapi.co/api/v2/type/${value}`);
                    const fullDetails = await Promise.all(
                      typeRes.data.pokemon.slice(0, 10).map(async (p: any) => {
                        try {
                          const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${p.pokemon.name}`);
                          return res.data;
                        } catch {
                          return null;
                        }
                      })
                    );
                    setRelatedPokemonsFull(fullDetails.filter(Boolean));
                  }
                }}
              >
                <option value="">All types</option>
                {types.map((type: any) => (
                  <option key={type.name} value={type.name} className="capitalize">
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-4">
              {relatedPokemonsFull
                .filter((poke: any) => {
                  if (!selectedRelatedType) return true;
                  return poke.types?.some((t: any) => t.type?.name === selectedRelatedType);
                })
                .map((poke: any, idx: number) => (
                  <div
                    key={poke.id || idx}
                    className="flex flex-row items-center bg-[#10182a] rounded-2xl shadow p-4 hover:bg-[#182040] transition group gap-6 cursor-pointer"
                    onClick={() => router.push(`/pokemon/${poke.name}`)}
                  >
                    <Image
                      src={
                        poke.id
                          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png`
                          : "/favicon.ico"
                      }
                      alt={poke.name}
                      width={80}
                      height={80}
                      className="rounded-xl bg-[#232b4a] shadow-lg group-hover:scale-105 transition"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white capitalize text-lg truncate">{poke.name}</span>
                        <span className="text-xs text-[#00eaff] font-mono bg-[#19213a] px-2 py-1 rounded-full">#{poke.id?.toString().padStart(3, "0")}</span>
                      </div>
                      {/* Có thể thêm type ở đây nếu muốn */}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 