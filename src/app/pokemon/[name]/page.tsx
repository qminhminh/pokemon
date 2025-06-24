import ClientPokemonDetail from './ClientPokemonDetail';
import axios from 'axios';

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  try {
    const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${name}`);
    const species = speciesRes.data;
    const flavor = species.flavor_text_entries.find((f: { flavor_text: string; language: { name: string } }) => f.language.name === "en")?.flavor_text.replace(/\f|\n/g, " ") || "Pokémon details";
    return {
      title: `Pokémon: ${name.charAt(0).toUpperCase() + name.slice(1)}`,
      description: flavor,
      openGraph: {
        title: `Pokémon: ${name.charAt(0).toUpperCase() + name.slice(1)}`,
        description: flavor,
        // Có thể thêm image nếu muốn
      },
    };
  } catch {
    return {
      title: `Pokémon: ${name}`,
      description: `Thông tin chi tiết về Pokémon ${name} trong Pokédex.`,
    };
  }
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <ClientPokemonDetail name={name} />;
} 