import { Bell, Settings, LogOut, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import type { UserProfileDTO } from "../../types";
import { useState } from "react";

interface HeaderProps {
  user: UserProfileDTO;
}

export function Header({ user }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Get the initials for the avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to home page after successful logout
        window.location.href = "/";
      } else {
      }
    } catch (error) {
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex justify-between items-center h-16 px-4 max-w-7xl relative">
        <div className="flex items-center">
          <nav className="hidden md:flex space-x-1">
            <Button
              variant="ghost"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 px-3"
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 px-3"
            >
              Explore
            </Button>
            <Button
              variant="ghost"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 px-3"
            >
              History
            </Button>
          </nav>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
          <img src="/images/logo.svg" alt="getTaste Logo" className="h-10" />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="text-gray-600 dark:text-gray-300 relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
            className="text-gray-600 dark:text-gray-300 hidden sm:flex"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Logout"
            className="text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hidden sm:flex"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>

          <div className="ml-2 flex items-center pl-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-[2px] rounded-full">
              <Avatar className="h-9 w-9 border-2 border-white dark:border-gray-800">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(user.nick)}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="ml-2 font-medium hidden md:inline-block text-gray-700 dark:text-gray-200">
              {user.nick}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            className="text-gray-600 dark:text-gray-300 md:hidden"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-md py-2 px-4 border-t">
          <div className="flex flex-col space-y-2">
            <Button variant="ghost" className="justify-start text-sm font-medium">
              Dashboard
            </Button>
            <Button variant="ghost" className="justify-start text-sm font-medium">
              Explore
            </Button>
            <Button variant="ghost" className="justify-start text-sm font-medium">
              History
            </Button>
            <Button variant="ghost" className="justify-start text-sm font-medium">
              Settings
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-sm font-medium text-red-500"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
