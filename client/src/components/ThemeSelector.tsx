import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, themes, type ThemeName } from "@/contexts/ThemeContext";

export function ThemeSelector() {
  const { theme: currentTheme, setTheme } = useTheme();

  const themeList: ThemeName[] = ["dark", "light", "neon", "minimal", "ocean"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Select theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Choose Your Style</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid gap-2 p-2">
          {themeList.map((themeName) => {
            const themeConfig = themes[themeName];
            const isActive = currentTheme === themeName;

            return (
              <DropdownMenuItem
                key={themeName}
                onClick={() => setTheme(themeName)}
                className="cursor-pointer p-3 flex items-start gap-3"
              >
                {/* Theme Preview */}
                <div className="flex-shrink-0 w-12 h-12 rounded border overflow-hidden">
                  <div
                    className="h-full w-full grid grid-cols-2 grid-rows-2"
                    style={{
                      background: `hsl(${themeConfig.colors.background})`,
                    }}
                  >
                    <div
                      style={{
                        background: `hsl(${themeConfig.colors.primary})`,
                      }}
                    />
                    <div
                      style={{
                        background: `hsl(${themeConfig.colors.accent})`,
                      }}
                    />
                    <div
                      style={{
                        background: `hsl(${themeConfig.colors.secondary})`,
                      }}
                    />
                    <div
                      style={{
                        background: `hsl(${themeConfig.colors.muted})`,
                      }}
                    />
                  </div>
                </div>

                {/* Theme Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{themeConfig.label}</span>
                    {isActive && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {themeConfig.description}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
