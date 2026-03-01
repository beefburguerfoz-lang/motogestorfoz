
import axios from "axios";
import { logger } from "../config/logger";

const KEY = process.env.GOOGLE_API_KEY;

/**
 * Valida um endereço usando Google Places e Geocoding.
 * Retorna o endereço formatado, bairro e coordenadas.
 */
export async function validateAddress(address: string) {
  if (!KEY) {
    logger.warn("GOOGLE_API_KEY não configurada. Usando mock para testes.");
    return mockValidateAddress(address);
  }

  try {
    // 1) Busca o local via Text Search para maior precisão de "intent" do usuário
    const places = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
      params: { query: address, key: KEY, language: 'pt-BR' }
    });
    
    const place = places.data.results?.[0];
    if (!place) throw new Error("address_not_found");

    // 2) Geocode para obter os componentes de endereço (como o Bairro)
    const geocode = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: { place_id: place.place_id, key: KEY, language: 'pt-BR' }
    });
    
    const result = geocode.data.results?.[0];
    if (!result) throw new Error("geocode_not_found");

    const components = result.address_components;
    
    // O bairro no Google Maps costuma ser 'sublocality' ou 'neighborhood'
    const bairroComp = components.find((c: any) => 
      c.types.includes("sublocality") || 
      c.types.includes("neighborhood") || 
      c.types.includes("sublocality_level_1")
    );
    
    const bairro = bairroComp?.long_name ?? "Geral";
    const location = result.geometry.location;

    return { 
      place_id: place.place_id, 
      formattedAddress: result.formatted_address, 
      lat: location.lat, 
      lng: location.lng, 
      bairro 
    };
  } catch (error: any) {
    logger.error({ error: error.message, address }, "Erro ao validar endereço no Google");
    throw new Error("Erro ao validar endereço. Por favor, seja mais específico.");
  }
}

/**
 * Calcula a distância em KM entre dois pontos usando a fórmula de Haversine.
 */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // Raio da Terra em KM
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  
  return R * c;
}

// Fallback para ambiente de desenvolvimento sem API Key
async function mockValidateAddress(address: string) {
  const isCentro = address.toLowerCase().includes("centro");
  return {
    place_id: "mock_id",
    formattedAddress: address + " (Simulado)",
    bairro: isCentro ? "Centro" : "Geral",
    lat: -23.5505,
    lng: -46.6333
  };
}
