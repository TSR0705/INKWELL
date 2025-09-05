import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react"; // icons

export default function DarkModeToggle() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  // Apply theme to <html>
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-2xl 
                 bg-[var(--light-accent)] dark:bg-[var(--dark-accent)] 
                 hover:bg-[var(--light-hover)] dark:hover:bg-[var(--dark-hover)] 
                 transition"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-[var(--text-light)]" />
      ) : (
        <Sun className="w-5 h-5 text-[var(--text-dark)]" />
      )}
    </button>
  );
}
