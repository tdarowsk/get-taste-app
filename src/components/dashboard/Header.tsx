import { Bell, User, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import type { UserProfileDTO } from "../../types";

interface HeaderProps {
  user: UserProfileDTO;
}

export function Header({ user }: HeaderProps) {
  // Get the initials for the avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex justify-between items-center h-16 px-4 max-w-7xl">
        <div className="flex items-center">
          <div className="mr-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              getTaste
            </h1>
          </div>
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
        </div>
      </div>
    </header>
  );
}
