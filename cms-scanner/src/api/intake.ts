import type { WarehouseIntakePayload } from "../lib/warehousePayload";
import { getApiBaseUrl, getIntakeApiUrl } from "./apiConfig";

export type IntakeSuccess = {
  ok: true;
  intakeId: string;
  updated: Array<{
    name: string;
    quantity: number;
    added: number;
    unit: string | null;
  }>;
};

export class IntakeApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "IntakeApiError";
    this.status = status;
  }
}

export async function submitIntake(
  payload: WarehouseIntakePayload
): Promise<IntakeSuccess> {
  const intakeUrl = getIntakeApiUrl();
  let res: Response;

  try {
    res = await fetch(intakeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new IntakeApiError(
      `Brak połączenia z ${intakeUrl}. Uruchom cms-demo`,
      0
    );
  }

  const body = (await res.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    const hint = res.status === 404 ? "Błąd serwera" : "";
    const message =
      body.message ??
      body.error ??
      `Błąd serwera (${res.status}): ${intakeUrl}.${hint}`;
    throw new IntakeApiError(message, res.status);
  }

  return body as IntakeSuccess;
}

export { getApiBaseUrl, getIntakeApiUrl } from "./apiConfig";
