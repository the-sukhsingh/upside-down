export type WhisperModelId = 'ggml-tiny.en.bin' | 'ggml-base.en.bin' | 'ggml-small.en.bin';

export type SLMModelId =
  | 'gemma-2-2b-it.gguf'
  | 'smollm2-360m-instruct.gguf'
  | 'llama-3.2-1b-instruct.gguf'
  | 'qwen2.5-0.5b-instruct.gguf';

export type ModelId = WhisperModelId | SLMModelId | string;

export type ModelType = 'whisper_stt' | 'slm_reasoning';

export type ModelStatus = 'not_downloaded' | 'downloading' | 'ready' | 'error';

export interface WhisperModelDefinition {
  id: ModelId;
  name: string;
  type?: ModelType;
  family?: 'Whisper' | 'Gemma' | 'SmolLM' | 'Llama' | 'Qwen' | string;
  fileName: string;
  sizeBytes: number;
  formattedSize: string;
  description: string;
  recommendedFor: string;
  downloadUrl: string;
  ramUsage: string;
  speed: string;
  accuracy: string;
  contextWindow?: number;
  quantization?: string;
}

export type AIModelDefinition = WhisperModelDefinition;

export interface DownloadedModelRecord {
  modelId: ModelId;
  fileName: string;
  localUri: string;
  fileSizeBytes: number;
  downloadedAt: string;
  status: ModelStatus;
  progressPercent: number;
  downloadedBytes: number;
  totalBytes: number;
  errorMessage?: string;
  modelType?: ModelType;
}

export interface ModelDownloadProgress {
  modelId: ModelId;
  progressPercent: number;
  downloadedBytes: number;
  totalBytes: number;
  speedBytesPerSec?: number;
}
