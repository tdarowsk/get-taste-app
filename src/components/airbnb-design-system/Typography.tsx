import React from "react";
import { cn } from "@/lib/utils";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Treść komponentu
   */
  children: React.ReactNode;

  /**
   * Dodatkowe klasy CSS
   */
  className?: string;

  /**
   * Czy tekst ma być przycinany po określonej liczbie linii
   */
  clamp?: number;
}

// Komponent Heading - Nagłówki
interface HeadingProps extends TypographyProps {
  /**
   * Poziom nagłówka (h1, h2, h3, h4, h5, h6)
   * @default "h1"
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Wariant nagłówka
   * @default "default"
   */
  variant?: "default" | "display" | "title" | "subtitle";
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 1, variant = "default", className, children, clamp, ...props }, ref) => {
    const Component = `h${level}` as keyof JSX.IntrinsicElements;

    const variantStyles = {
      default: "",
      display: "font-bold tracking-tight",
      title: "font-semibold",
      subtitle: "font-medium",
    };

    const sizeStyles = {
      1: "text-4xl sm:text-5xl",
      2: "text-3xl sm:text-4xl",
      3: "text-2xl sm:text-3xl",
      4: "text-xl sm:text-2xl",
      5: "text-lg sm:text-xl",
      6: "text-base sm:text-lg",
    };

    const clampStyles = clamp ? `line-clamp-${clamp}` : "";

    return (
      <Component
        ref={ref}
        className={cn(
          "text-gray-900",
          sizeStyles[level],
          variantStyles[variant],
          clampStyles,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = "Heading";

// Komponent Text - Tekst podstawowy
interface TextProps extends TypographyProps {
  /**
   * Wariant tekstu
   * @default "body"
   */
  variant?: "body" | "lead" | "small" | "caption" | "tiny";

  /**
   * Waga tekstu
   */
  weight?: "regular" | "medium" | "semibold" | "bold";

  /**
   * Element HTML, jako który ma być renderowany komponent
   * @default "p"
   */
  as?: keyof JSX.IntrinsicElements;
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant = "body", weight, className, as = "p", children, clamp, ...props }, ref) => {
    const Component = as;

    const variantStyles = {
      lead: "text-lg sm:text-xl",
      body: "text-base",
      small: "text-sm",
      caption: "text-xs",
      tiny: "text-xs",
    };

    const weightStyles = {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    };

    const clampStyles = clamp ? `line-clamp-${clamp}` : "";

    return (
      <Component
        ref={ref as any}
        className={cn(
          "text-gray-700",
          variantStyles[variant],
          weight && weightStyles[weight],
          clampStyles,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = "Text";

// Komponent Link - Linki
interface LinkProps extends TypographyProps {
  /**
   * URL, do którego prowadzi link
   */
  href: string;

  /**
   * Czy link ma się otwierać w nowej karcie
   * @default false
   */
  external?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, external = false, className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          "text-rose-500 hover:text-rose-700 transition-colors underline-offset-2 hover:underline",
          className
        )}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      >
        {children}
      </a>
    );
  }
);

Link.displayName = "Link";
