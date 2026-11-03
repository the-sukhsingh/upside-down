import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ModelId,
  WhisperModelDefinition,
  DownloadedModelRecord,
} from '@/types/model';

const STORAGE_KEY_MODELS = '@upsidedown_downloaded_models';
const STORAGE_KEY_ACTIVE_WHISPER_MODEL = '@upsidedown_active_whisper_model';
const STORAGE_KEY_ACTIVE_SLM_MODEL = '@upsidedown_active_slm_model';

export const AVAILABLE_WHISPER_MODELS: WhisperModelDefinition[] = [
  {
    id: 'ggml-tiny.en.bin',
    type: 'whisper_stt',
    family: 'Whisper',
    name: 'Whisper Tiny (English)',
    fileName: 'ggml-tiny.en.bin',
    sizeBytes: 77704715, // ~75 MB
    formattedSize: '75 MB',
    description: 'Ultra-fast on-device speech-to-text. Sub-second latency and minimal RAM.',
    recommendedFor: 'Best for fast post-recording transcription and battery efficiency.',
    downloadUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
    ramUsage: '~150 MB',
    speed: 'Very Fast (~0.3x real-time)',
    accuracy: 'Good (88% word accuracy)',
  },
  {
    id: 'ggml-base.en.bin',
    type: 'whisper_stt',
    family: 'Whisper',
    name: 'Whisper Base (English)',
    fileName: 'ggml-base.en.bin',
    sizeBytes: 147964284, // ~142 MB
    formattedSize: '142 MB',
    description: 'Balanced precision model. Handles multiple speakers and acoustics effectively.',
    recommendedFor: 'Best balance between accuracy and on-device processing power.',
    downloadUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
    ramUsage: '~280 MB',
    speed: 'Fast (~0.6x real-time)',
    accuracy: 'High (94% word accuracy)',
  },
  {
    id: 'ggml-small.en.bin',
    type: 'whisper_stt',
    family: 'Whisper',
    name: 'Whisper Small (English)',
    fileName: 'ggml-small.en.bin',
    sizeBytes: 487904652, // ~466 MB
    formattedSize: '466 MB',
    description: 'High-fidelity model. Superior transcription accuracy for technical terms.',
    recommendedFor: 'Offline high-precision transcription.',
    downloadUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
    ramUsage: '~600 MB',
    speed: 'Moderate (~1.2x real-time)',
    accuracy: 'Very High (97% word accuracy)',
  },
];

export const AVAILABLE_SLM_MODELS: WhisperModelDefinition[] = [
  {
    id: 'gemma-2-2b-it.gguf',
    type: 'slm_reasoning',
    family: 'Gemma',
    name: 'Google Gemma 2 (2B Instruct)',
    fileName: 'gemma-2-2b-it-Q4_K_M.gguf',
    sizeBytes: 1713000000,
    formattedSize: '1.6 GB',
    description: 'Google state-of-the-art open SLM. Exceptional reasoning, meeting context synthesis, and rigorous task extraction.',
    recommendedFor: 'Recommended for precise action item detection, owner assignment, and executive decision summaries.',
    downloadUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    ramUsage: '~2.2 GB',
    speed: 'Fast on Edge NPU / GPU',
    accuracy: 'State-of-the-Art (Top MMLU)',
    contextWindow: 8192,
    quantization: 'Q4_K_M',
  },
  {
    id: 'smollm2-360m-instruct.gguf',
    type: 'slm_reasoning',
    family: 'SmolLM',
    name: 'SmolLM2 (360M Instruct)',
    fileName: 'smollm2-360m-instruct-q4_k_m.gguf',
    sizeBytes: 240000000,
    formattedSize: '229 MB',
    description: 'Hugging Face ultra-compact edge SLM. Instantaneous local inference with minimal memory footprint.',
    recommendedFor: 'Ultra-fast task extraction under 300MB RAM. Perfect for low-latency battery saving.',
    downloadUrl: 'https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF/resolve/main/smollm2-360m-instruct-q4_k_m.gguf',
    ramUsage: '~300 MB',
    speed: 'Ultra Fast (>40 tok/sec)',
    accuracy: 'Very Good for size',
    contextWindow: 4096,
    quantization: 'Q4_K_M',
  },
  {
    id: 'llama-3.2-1b-instruct.gguf',
    type: 'slm_reasoning',
    family: 'Llama',
    name: 'Meta Llama 3.2 (1B Instruct)',
    fileName: 'llama-3.2-1b-instruct-q4_k_m.gguf',
    sizeBytes: 740000000,
    formattedSize: '705 MB',
    description: 'Meta lightweight edge model with high-precision instruction following and deep contextual synthesis.',
    recommendedFor: 'Deep meeting comprehension, nuanced debate synthesis, and complex action item lists.',
    downloadUrl: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    ramUsage: '~1.1 GB',
    speed: 'Fast (>25 tok/sec)',
    accuracy: 'High (Llama 3.2 Generation)',
    contextWindow: 8192,
    quantization: 'Q4_K_M',
  },
  {
    id: 'qwen2.5-0.5b-instruct.gguf',
    type: 'slm_reasoning',
    family: 'Qwen',
    name: 'Qwen 2.5 (0.5B Instruct)',
    fileName: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
    sizeBytes: 390000000,
    formattedSize: '372 MB',
    description: 'Alibaba balanced small language model optimized for rapid action item detection and keyword tagging.',
    recommendedFor: 'Fast action item extraction and multi-lingual meeting notes.',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
    ramUsage: '~550 MB',
    speed: 'Very Fast (>35 tok/sec)',
    accuracy: 'High reasoning density',
    contextWindow: 4096,
    quantization: 'Q4_K_M',
  },
];

export async function getActiveWhisperModelId(): Promise<string> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_WHISPER_MODEL);
    return val || 'ggml-tiny.en.bin';
  } catch {
    return 'ggml-tiny.en.bin';
  }
}

export async function setActiveWhisperModelId(modelId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_WHISPER_MODEL, modelId);
  } catch {
    // Ignore error
  }
}

export async function getActiveSLMModelId(): Promise<string> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_SLM_MODEL);
    return val || 'gemma-2-2b-it.gguf';
  } catch {
    return 'gemma-2-2b-it.gguf';
  }
}

export async function setActiveSLMModelId(modelId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_SLM_MODEL, modelId);
  } catch {
    // Ignore error
  }
}

