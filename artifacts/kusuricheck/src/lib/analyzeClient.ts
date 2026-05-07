import { useMutation } from "@tanstack/react-query";
import type { AnalyzeResponse as GeneratedAnalyzeResponse } from "@workspace/api-client-react";

export type AnalyzeResponse = GeneratedAnalyzeResponse & {
  sections_ja: GeneratedAnalyzeResponse["sections"];
  sections_en: GeneratedAnalyzeResponse["sections"];
  product_name_en?: string;
};

export type CautionProfile = {
  pregnant_breastfeeding: boolean;
  elderly: boolean;
  child_use: boolean;
  liver_concern: boolean;
  kidney_concern: boolean;
};

export type UserPreferences = {
  language: "ja" | "en";
  audience_mode: "standard" | "simple" | "caregiver";
  caution_profile: CautionProfile;
};

export const DEFAULT_CAUTION_PROFILE: CautionProfile = {
  pregnant_breastfeeding: false,
  elderly: false,
  child_use: false,
  liver_concern: false,
  kidney_concern: false,
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: "ja",
  audience_mode: "standard",
  caution_profile: DEFAULT_CAUTION_PROFILE,
};

export type AnalyzeFileInput = {
  file: File;
  preferences: UserPreferences;
};

export class AnalyzeError extends Error {
  status: number;
  errorCode: string;
  requestId?: string;

  constructor(
    status: number,
    errorCode: string,
    message: string,
    requestId?: string,
  ) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.requestId = requestId;
  }
}

export async function analyzeFile(
  input: AnalyzeFileInput,
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("preferences", JSON.stringify(input.preferences));

  const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const resp = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    body: form,
  });

  if (!resp.ok) {
    let detail: { error?: string; message?: string; request_id?: string } = {};
    try {
      const body = await resp.json();
      detail = body?.detail ?? body;
    } catch {
      // ignore
    }
    throw new AnalyzeError(
      resp.status,
      detail.error ?? "request_failed",
      detail.message ?? `Request failed with status ${resp.status}`,
      detail.request_id,
    );
  }

  return (await resp.json()) as AnalyzeResponse;
}

export function useAnalyzeFile() {
  return useMutation<AnalyzeResponse, AnalyzeError, AnalyzeFileInput>({
    mutationFn: analyzeFile,
  });
}
