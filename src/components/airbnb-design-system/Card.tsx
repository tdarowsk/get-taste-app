import React from "react";
import { cn } from "@/lib/utils";

// Główny komponent Card
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość karty
   */
  children: React.ReactNode;

  /**
   * Czy karta ma mieć obramowanie
   * @default true
   */
  bordered?: boolean;

  /**
   * Czy karta ma mieć efekt cienia
   * @default true
   */
  shadowed?: boolean;

  /**
   * Czy karta ma mieć efekt hover
   * @default false
   */
  hoverable?: boolean;

  /**
   * Czy karta ma być interaktywna (działać jako przycisk/link)
   * @default false
   */
  interactive?: boolean;

  /**
   * URL, do którego prowadzi karta (jeśli ma być klikalna)
   */
  href?: string;

  /**
   * Funkcja wykonywana po kliknięciu karty (jeśli ma być klikalna)
   */
  onClick?: () => void;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      children,
      bordered = true,
      shadowed = true,
      hoverable = false,
      interactive = false,
      href,
      onClick,
      ...props
    },
    ref
  ) => {
    const cardStyles = cn(
      "bg-white rounded-xl overflow-hidden",
      bordered && "border border-gray-200",
      shadowed && "shadow-sm",
      hoverable && "transition-all duration-200 hover:shadow-md",
      interactive && "cursor-pointer",
      className
    );

    // Jeśli karta ma href, renderuj jako link
    if (href) {
      return (
        <a href={href} ref={ref as React.Ref<HTMLAnchorElement>} className={cardStyles} {...props}>
          {children}
        </a>
      );
    }

    // Jeśli karta ma onClick, dodaj obsługę kliknięcia
    if (interactive && onClick) {
      return (
        <div
          ref={ref}
          className={cardStyles}
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onClick();
            }
          }}
          {...props}
        >
          {children}
        </div>
      );
    }

    // Standardowa karta
    return (
      <div ref={ref} className={cardStyles} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Nagłówek karty
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość nagłówka
   */
  children: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("px-6 pt-6 pb-4", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

// Treść karty
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość treści karty
   */
  children: React.ReactNode;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("px-6 py-2", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

// Stopka karty
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość stopki
   */
  children: React.ReactNode;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("px-6 pt-4 pb-6 flex items-center", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

// Tytuł karty
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Zawartość tytułu
   */
  children: React.ReactNode;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("text-lg font-semibold text-gray-900 mb-1", className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "CardTitle";

// Opis karty
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /**
   * Zawartość opisu
   */
  children: React.ReactNode;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn("text-sm text-gray-500", className)} {...props}>
        {children}
      </p>
    );
  }
);

CardDescription.displayName = "CardDescription";

// Grafika karty
interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * URL obrazu
   */
  src: string;

  /**
   * Alternatywny tekst dla obrazu
   */
  alt: string;
}

export const CardImage = React.forwardRef<HTMLImageElement, CardImageProps>(
  ({ className, src, alt, ...props }, ref) => {
    return (
      <div className="relative w-full aspect-[3/2] overflow-hidden">
        <img
          ref={ref}
          src={src}
          alt={alt}
          className={cn("w-full h-full object-cover", className)}
          {...props}
        />
      </div>
    );
  }
);

CardImage.displayName = "CardImage";
