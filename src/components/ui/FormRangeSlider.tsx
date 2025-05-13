import { useFormContext, Controller } from "react-hook-form";
import type { FieldValues, Path } from "react-hook-form";

interface FormRangeSliderProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  showPercentage?: boolean;
}

export function FormRangeSlider<TFieldValues extends FieldValues>({
  name,
  label,
  min = 0,
  max = 1,
  step = 0.1,
  showPercentage = true,
}: FormRangeSliderProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-1">
          <div className="flex justify-between">
            <label htmlFor={`range-${field.name}`} className="text-sm font-medium">
              {label}
            </label>
            {showPercentage && (
              <span className="text-sm text-muted-foreground">
                {Math.round(field.value * 100)}%
              </span>
            )}
          </div>
          <input
            id={`range-${field.name}`}
            type="range"
            min={min}
            max={max}
            step={step}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            className="w-full"
          />
        </div>
      )}
    />
  );
}
