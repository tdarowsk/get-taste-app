import React from "react";
import { cn } from "@/lib/utils";

// Główny komponent List
interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  /**
   * Zawartość listy
   */
  children: React.ReactNode;

  /**
   * Wariant listy
   * @default "default"
   */
  variant?: "default" | "cards" | "menu" | "divided";

  /**
   * Czy elementy listy mają być rozdzielone separatorami
   * @default false
   */
  withSeparators?: boolean;

  /**
   * Czy lista ma być pionowa (true) czy pozioma (false)
   * @default true
   */
  vertical?: boolean;
}

export const List = React.forwardRef<HTMLUListElement, ListProps>(
  (
    { className, children, variant = "default", withSeparators = false, vertical = true, ...props },
    ref
  ) => {
    // Różne style dla różnych wariantów list
    const variantStyles = {
      default: "space-y-1",
      cards: "space-y-3",
      menu: "space-y-0.5",
      divided: "divide-y divide-gray-100",
    };

    // Zastosuj odpowiednie style dla układu wertykalnego/horyzontalnego
    const layoutStyles = vertical
      ? variantStyles[variant]
      : "flex flex-wrap items-center gap-x-3 gap-y-2";

    // Jeśli używamy separatorów, zastosuj odpowiednie style podziału
    const separatorStyles = withSeparators && vertical ? "divide-y divide-gray-100" : "";

    return (
      <ul ref={ref} className={cn(layoutStyles, separatorStyles, className)} {...props}>
        {children}
      </ul>
    );
  }
);

List.displayName = "List";

// Komponent elementu listy
interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /**
   * Zawartość elementu listy
   */
  children: React.ReactNode;

  /**
   * Ikona wyświetlana przed zawartością
   */
  startIcon?: React.ReactNode;

  /**
   * Ikona wyświetlana po zawartości
   */
  endIcon?: React.ReactNode;

  /**
   * Czy element listy ma być interaktywny
   * @default false
   */
  interactive?: boolean;

  /**
   * Czy element listy jest aktywny
   * @default false
   */
  active?: boolean;

  /**
   * Czy element listy ma być wyróżniony
   * @default false
   */
  highlighted?: boolean;
}

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  (
    {
      className,
      children,
      startIcon,
      endIcon,
      interactive = false,
      active = false,
      highlighted = false,
      ...props
    },
    ref
  ) => {
    return (
      <li
        ref={ref}
        className={cn(
          "relative",
          interactive &&
            "cursor-pointer transition-colors hover:bg-gray-50 focus:outline-none focus:bg-gray-50",
          active && "text-rose-500 font-medium",
          highlighted && "bg-gray-50",
          className
        )}
        {...props}
      >
        <div className="flex items-center py-2 px-1">
          {startIcon && <div className="mr-3 flex-shrink-0 text-gray-400">{startIcon}</div>}

          <div className="min-w-0 flex-1">{children}</div>

          {endIcon && <div className="ml-3 flex-shrink-0 text-gray-400">{endIcon}</div>}
        </div>
      </li>
    );
  }
);

ListItem.displayName = "ListItem";

// Komponent karty listy - rozbudowany element listy wyglądający jak karta
interface ListCardProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /**
   * Główna zawartość karty
   */
  children: React.ReactNode;

  /**
   * Obrazek wyświetlany w karcie
   */
  image?: React.ReactNode;

  /**
   * Tytuł karty
   */
  title: string;

  /**
   * Opis karty (opcjonalny)
   */
  description?: string;

  /**
   * Akcje karty (opcjonalne)
   */
  actions?: React.ReactNode;

  /**
   * Czy karta ma być interaktywna
   * @default false
   */
  interactive?: boolean;
}

export const ListCard = React.forwardRef<HTMLLIElement, ListCardProps>(
  (
    { className, children, image, title, description, actions, interactive = false, ...props },
    ref
  ) => {
    return (
      <li
        ref={ref}
        className={cn(
          "relative rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden",
          interactive && "cursor-pointer transition-shadow hover:shadow-md",
          className
        )}
        {...props}
      >
        <div className="flex flex-col sm:flex-row">
          {image && <div className="sm:w-1/3 lg:w-1/4 flex-shrink-0">{image}</div>}

          <div className="p-4 flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 mb-1 truncate">{title}</h3>

            {description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{description}</p>
            )}

            <div className="mt-auto">{children}</div>

            {actions && <div className="mt-4 flex items-center gap-2 justify-end">{actions}</div>}
          </div>
        </div>
      </li>
    );
  }
);

ListCard.displayName = "ListCard";

// Komponent elementu menu
interface ListMenuItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /**
   * Zawartość elementu menu
   */
  children: React.ReactNode;

  /**
   * Ikona wyświetlana przed zawartością
   */
  icon?: React.ReactNode;

  /**
   * Czy element menu jest aktywny
   */
  active?: boolean;

  /**
   * Funkcja wykonywana po kliknięciu
   */
  onClick?: () => void;

  /**
   * Czy element menu jest wyłączony
   */
  disabled?: boolean;
}

export const ListMenuItem = React.forwardRef<HTMLLIElement, ListMenuItemProps>(
  ({ className, children, icon, active, onClick, disabled, ...props }, ref) => {
    return (
      <li ref={ref} className={cn(className)} {...props}>
        <button
          type="button"
          className={cn(
            "w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors",
            active ? "bg-rose-50 text-rose-500 font-medium" : "text-gray-700",
            !disabled && !active && "hover:bg-gray-100",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          )}
          onClick={onClick}
          disabled={disabled}
        >
          {icon && (
            <span className={cn("flex-shrink-0", active ? "text-rose-500" : "text-gray-400")}>
              {icon}
            </span>
          )}
          <span>{children}</span>
        </button>
      </li>
    );
  }
);

ListMenuItem.displayName = "ListMenuItem";

// Pusty stan listy
interface ListEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość pustego stanu
   */
  children: React.ReactNode;

  /**
   * Ikona wyświetlana w pustym stanie
   */
  icon?: React.ReactNode;

  /**
   * Tytuł pustego stanu
   */
  title?: string;
}

export const ListEmpty = React.forwardRef<HTMLDivElement, ListEmptyProps>(
  ({ className, children, icon, title, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "py-8 px-4 text-center rounded-lg border border-dashed border-gray-300 bg-gray-50",
          className
        )}
        {...props}
      >
        {icon && <div className="mx-auto h-12 w-12 text-gray-400 mb-3">{icon}</div>}

        {title && <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>}

        <div className="text-sm text-gray-500 max-w-md mx-auto">{children}</div>
      </div>
    );
  }
);

ListEmpty.displayName = "ListEmpty";

export type { ListProps, ListItemProps, ListCardProps, ListMenuItemProps, ListEmptyProps };
