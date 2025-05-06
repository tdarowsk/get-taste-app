import React from "react";
import { cn } from "@/lib/utils";

// Główny komponent nawigacyjny
interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Zawartość nawigacji
   */
  children: React.ReactNode;

  /**
   * Czy nawigacja jest pozioma (true) czy pionowa (false)
   * @default true
   */
  horizontal?: boolean;
}

export const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, children, horizontal = true, ...props }, ref) => {
    return (
      <nav ref={ref} className={cn("bg-white", horizontal ? "py-3" : "py-4", className)} {...props}>
        <div
          className={cn(
            horizontal ? "flex items-center" : "flex flex-col",
            horizontal ? "gap-x-6" : "gap-y-3"
          )}
        >
          {children}
        </div>
      </nav>
    );
  }
);

Navigation.displayName = "Navigation";

// Komponent kontenera dla nawigacji
interface NavigationContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość kontenera
   */
  children: React.ReactNode;

  /**
   * Czy kontener ma być pełnej szerokości
   * @default false
   */
  fullWidth?: boolean;
}

export const NavigationContainer = React.forwardRef<HTMLDivElement, NavigationContainerProps>(
  ({ className, children, fullWidth = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(fullWidth ? "w-full px-4" : "container mx-auto px-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NavigationContainer.displayName = "NavigationContainer";

// Komponent loga w nawigacji
interface NavigationLogoProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Zawartość loga
   */
  children: React.ReactNode;

  /**
   * URL, do którego prowadzi logo
   * @default "/"
   */
  href?: string;
}

export const NavigationLogo = React.forwardRef<HTMLAnchorElement, NavigationLogoProps>(
  ({ className, children, href = "/", ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn("flex items-center text-rose-500 font-bold text-xl shrink-0", className)}
        {...props}
      >
        {children}
      </a>
    );
  }
);

NavigationLogo.displayName = "NavigationLogo";

// Komponent linków w nawigacji
interface NavigationLinksProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość sekcji linków
   */
  children: React.ReactNode;
}

export const NavigationLinks = React.forwardRef<HTMLDivElement, NavigationLinksProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-1 sm:gap-2 md:gap-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NavigationLinks.displayName = "NavigationLinks";

// Pojedynczy link w nawigacji
interface NavigationLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Zawartość linku
   */
  children: React.ReactNode;

  /**
   * Czy link jest aktywny
   * @default false
   */
  active?: boolean;

  /**
   * Ikona wyświetlana przed tekstem
   */
  icon?: React.ReactNode;
}

export const NavigationLink = React.forwardRef<HTMLAnchorElement, NavigationLinkProps>(
  ({ className, children, active = false, icon, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          "inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors",
          "hover:bg-gray-100",
          active ? "text-rose-500" : "text-gray-700",
          className
        )}
        aria-current={active ? "page" : undefined}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </a>
    );
  }
);

NavigationLink.displayName = "NavigationLink";

// Przycisk hamburger menu dla wersji mobilnej
interface NavigationHamburgerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Czy menu jest otwarte
   */
  isOpen: boolean;

  /**
   * Funkcja zmieniająca stan otwarcia menu
   */
  onToggle: () => void;
}

export const NavigationHamburger = React.forwardRef<HTMLButtonElement, NavigationHamburgerProps>(
  ({ className, isOpen, onToggle, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-rose-500 sm:hidden",
          className
        )}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Zamknij menu" : "Otwórz menu"}
        {...props}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>
    );
  }
);

NavigationHamburger.displayName = "NavigationHamburger";

// Menu mobilne
interface NavigationMobileMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość menu mobilnego
   */
  children: React.ReactNode;

  /**
   * Czy menu jest otwarte
   */
  isOpen: boolean;
}

export const NavigationMobileMenu = React.forwardRef<HTMLDivElement, NavigationMobileMenuProps>(
  ({ className, children, isOpen, ...props }, ref) => {
    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "sm:hidden absolute top-full left-0 right-0 bg-white shadow-lg z-20 border-t py-3",
          className
        )}
        {...props}
      >
        <div className="space-y-1 px-4">{children}</div>
      </div>
    );
  }
);

NavigationMobileMenu.displayName = "NavigationMobileMenu";

// Akcje nawigacyjne (np. przyciski logowania, profil)
interface NavigationActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Zawartość sekcji akcji
   */
  children: React.ReactNode;
}

export const NavigationActions = React.forwardRef<HTMLDivElement, NavigationActionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center gap-2 ml-auto", className)} {...props}>
        {children}
      </div>
    );
  }
);

NavigationActions.displayName = "NavigationActions";

export type {
  NavigationProps,
  NavigationContainerProps,
  NavigationLogoProps,
  NavigationLinksProps,
  NavigationLinkProps,
  NavigationHamburgerProps,
  NavigationMobileMenuProps,
  NavigationActionsProps,
};
