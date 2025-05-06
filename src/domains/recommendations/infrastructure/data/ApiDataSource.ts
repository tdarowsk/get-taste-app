import { DataSource } from "./DataSource";

export class ApiDataSource implements DataSource {
  async query<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
