import { useFormContext, Controller } from "react-hook-form";
import type { RecommendationFormValues } from "../types/forms";

export function CategorySelector() {
  const { control } = useFormContext<RecommendationFormValues>();

  return (
    <Controller
      name="category"
      control={control}
      render={({ field }) => (
        <div className="flex space-x-2 mb-6">
          <button
            type="button"
            onClick={() => field.onChange("music")}
            className={`px-4 py-2 rounded-md flex items-center ${
              field.value === "music"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            Muzyka
          </button>
          <button
            type="button"
            onClick={() => field.onChange("film")}
            className={`px-4 py-2 rounded-md flex items-center ${
              field.value === "film"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            Film
          </button>
        </div>
      )}
    />
  );
}
