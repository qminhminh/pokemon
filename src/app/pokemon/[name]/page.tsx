import { Metadata } from "next";
import ClientPokemonDetail from './ClientPokemonDetail';

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  try {
    const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${params.name}`);
    if (!pokeRes.ok) throw new Error();
    const pokemon = await pokeRes.json();
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${params.name}`);
    if (!speciesRes.ok) throw new Error();
    const species = await speciesRes.json();
    const flavor = species.flavor_text_entries.find((f: any) => f.language.name === "en")?.flavor_text.replace(/\f|\n/g, " ") || "Pokémon details";
    return {
      title: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} | Pokédex`,
      description: flavor,
      openGraph: {
        title: `${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} | Pokédex`,
        description: flavor,
        images: [pokemon.sprites.other["official-artwork"].front_default],
      },
    };
  } catch {
    return {
      title: "Pokémon | Pokédex",
      description: "Pokémon details",
    };
  }
}

export default function Page({ params }: { params: { name: string } }) {
  return <ClientPokemonDetail name={params.name} />;
} 