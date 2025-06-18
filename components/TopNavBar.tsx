// components/TopNavBar.tsx - Updated with working user selection
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { themes } from "@/styles/themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeColors = {
  neutral: "#000000",
  red: "#EF4444",
  violet: "#8B5CF6",
  blue: "#3B82F6",
  tangerine: "#F97316",
  emerald: "#10B981",
  amber: "#F59E0B",
} as const;

type ThemeName = keyof typeof themes;

const ColorCircle = ({
  themeName,
  isSelected,
}: {
  themeName: ThemeName;
  isSelected: boolean;
}) => (
  <div
    className="relative border flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
    style={{ backgroundColor: themeColors[themeName] }}
  >
    {isSelected && (
      <div className="absolute inset-0 flex items-center justify-center">
        <Check className="text-white" size={12} />
      </div>
    )}
  </div>
);

const TopNavBar = () => {
  const { theme, setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ThemeName>("neutral");
  const [mounted, setMounted] = useState(false);

  // Email options for testing
  const userEmails = [
    "user-1@example.com",
    "alice@company.com",
    "bob@testuser.org",
    "support-test@demo.com",
    "jane.doe@sample.co",
  ];

  // Get or set user ID from localStorage
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    const savedColorTheme = (localStorage.getItem("color-theme") ||
      "neutral") as ThemeName;
    setColorTheme(savedColorTheme);
    applyTheme(savedColorTheme, theme === "dark");

    // Load user ID on client side
    if (typeof window !== 'undefined') {
      const savedUserId = localStorage.getItem('intercom_user_id');
      if (!savedUserId || !userEmails.includes(savedUserId)) {
        localStorage.setItem('intercom_user_id', userEmails[0]);
        setCurrentUserEmail(userEmails[0]);
      } else {
        setCurrentUserEmail(savedUserId);
      }
    }
  }, [theme]);

  const applyTheme = (newColorTheme: ThemeName, isDark: boolean) => {
    const root = document.documentElement;
    const themeVariables = isDark
      ? themes[newColorTheme].dark
      : themes[newColorTheme].light;

    Object.entries(themeVariables).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value as string);
    });
  };

  const handleThemeChange = (newColorTheme: ThemeName) => {
    setColorTheme(newColorTheme);
    localStorage.setItem("color-theme", newColorTheme);
    applyTheme(newColorTheme, theme === "dark");
  };

  const handleModeChange = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
    if (mode !== "system") {
      applyTheme(colorTheme, mode === "dark");
    }
  };

  const handleUserChange = (email: string) => {
    setCurrentUserEmail(email);
    localStorage.setItem('intercom_user_id', email);
    // Trigger a page reload to reset the conversation
    window.location.reload();
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav className="text-foreground p-4 flex justify-between items-center border-b">
      <div className="font-bold text-sm flex gap-2 items-center">
        <div className="flex items-center">
          <div className="text-sm mr-3 text-muted-foreground">Current User:</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="font-mono">
                {currentUserEmail || 'Select User'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {userEmails.map((email) => (
                <DropdownMenuItem
                  key={email}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => handleUserChange(email)}
                >
                  {email === currentUserEmail && <Check className="h-4 w-4" />}
                  <span className="font-mono text-sm">{email}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ColorCircle themeName={colorTheme} isSelected={false} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(themes) as ThemeName[]).map((themeName) => (
              <DropdownMenuItem
                key={themeName}
                onClick={() => handleThemeChange(themeName)}
                className="flex items-center gap-2"
              >
                <ColorCircle
                  themeName={themeName}
                  isSelected={colorTheme === themeName}
                />
                {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleModeChange("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModeChange("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModeChange("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default TopNavBar;