import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"

export function ThemeSwitch() {
    const { theme, setTheme } = useTheme()
    return (
        <Switch id="theme-switch" checked={theme === "dark"} onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")} />
    )
}
