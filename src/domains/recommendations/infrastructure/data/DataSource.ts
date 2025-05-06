export interface DataSource {
  query<T>(url: string, options?: RequestInit): Promise<T>;
}
