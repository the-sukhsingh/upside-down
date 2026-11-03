/**
 * Central API Configuration for Meeting Note Taker
 * 
 * Provide your API keys in .env.local via:
 * - EXPO_PUBLIC_GROQ_API_KEY
 * - EXPO_PUBLIC_SARVAM_API_KEY
 */

export const API_CONFIG = {
  // Groq API Key (loaded from .env.local via EXPO_PUBLIC_GROQ_API_KEY)
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',

  // Sarvam AI Subscription Key (loaded from .env.local via EXPO_PUBLIC_SARVAM_API_KEY)
  SARVAM_API_KEY: process.env.EXPO_PUBLIC_SARVAM_API_KEY || '',
};

export function getGroqApiKey(): string {
  return (API_CONFIG.GROQ_API_KEY || '').trim();
}

export function getSarvamApiKey(): string {
  return (API_CONFIG.SARVAM_API_KEY || '').trim();
}

export function hasGroqApiKey(): boolean {
  return getGroqApiKey().length > 0;
}

export function hasSarvamApiKey(): boolean {
  return getSarvamApiKey().length > 0;
}
