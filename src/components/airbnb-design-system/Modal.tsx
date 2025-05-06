import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Główny komponent Modal
interface ModalProps {
  /**
   * Czy modal jest otwarty
   */
  isOpen: boolean;

  /**
   * Funkcja wywoływana przy zamykaniu modala
   */
  onClose: () => void;

  /**
   * Zawartość modala
   */
  children: React.ReactNode;

  /**
   * Dodatkowe klasy CSS dla modala
   */
  className?: string;

  /**
   * Rozmiar modala
   * @default "medium"
   */
  size?: "small" | "medium" | "large" | "full";

  /**
   * Czy zamykać modal po kliknięciu w tło
   * @default true
   */
  closeOnBackdropClick?: boolean;

  /**
   * Czy zamykać modal po naciśnięciu klawisza Escape
   * @default true
   */
  closeOnEsc?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  size = "medium",
  closeOnBackdropClick = true,
  closeOnEsc = true,
}) => {
  // Hook obsługujący naciśnięcie klawisza Escape
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (isOpen && closeOnEsc && event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      // Zatrzymaj przewijanie strony, gdy modal jest otwarty
      document.body.style.overflow = "hidden";

      // Dodaj obsługę klawisza Escape
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      // Przywróć przewijanie strony, gdy modal jest zamknięty
      document.body.style.overflow = "";

      // Usuń obsługę klawisza Escape
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Obsługa kliknięcia w tło
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  // Rozmiary modala
  const sizeClasses = {
    small: "max-w-sm",
    medium: "max-w-md",
    large: "max-w-lg",
    full: "max-w-full m-4",
  };

  // Nie renderuj niczego, jeśli modal jest zamknięty
  if (!isOpen) return null;

  // Renderuj modal w portalu
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        className={cn(
          "w-full bg-white rounded-xl shadow-2xl transform transition-all duration-300 animate-scale-in",
          sizeClasses[size],
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

// Nagłówek modala
interface ModalHeaderProps {
  /**
   * Tytuł modala
   */
  title: string;

  /**
   * Funkcja zamykająca modal
   */
  onClose: () => void;

  /**
   * Dodatkowe klasy CSS
   */
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose, className }) => {
  return (
    <div className={cn("flex items-center justify-between px-6 pt-6 pb-4", className)}>
      <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Zamknij"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

// Zawartość modala
interface ModalContentProps {
  /**
   * Zawartość modala
   */
  children: React.ReactNode;

  /**
   * Dodatkowe klasy CSS
   */
  className?: string;
}

export const ModalContent: React.FC<ModalContentProps> = ({ children, className }) => {
  return <div className={cn("px-6 py-2", className)}>{children}</div>;
};

// Stopka modala
interface ModalFooterProps {
  /**
   * Zawartość stopki
   */
  children: React.ReactNode;

  /**
   * Dodatkowe klasy CSS
   */
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => {
  return <div className={cn("flex justify-end gap-3 px-6 pt-4 pb-6", className)}>{children}</div>;
};
