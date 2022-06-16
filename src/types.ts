export interface IVoiceControlStatus {
  enabled: boolean;
  lastResult?: string;
  lastConfidence?: number;
  error?: string;
}
