"use client";

import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"

type ThemeMode = "light" | "dark";

type ThemeSwitchProps = {
    initialTheme: ThemeMode;
};

export function ThemeSwitch({ initialTheme }: ThemeSwitchProps) {
    const [mounted, setMounted] = useState(false)
    const { resolvedTheme, setTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])
    
    const isDark = mounted ? resolvedTheme === "dark" : initialTheme === "dark";

    const onCheckedChange = (checked: boolean) => {
        const nextTheme: ThemeMode = checked ? "dark" : "light";
        setTheme(nextTheme);
        document.cookie = `theme=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
    };

    return (
        <Switch 
            id="theme-switch" 
            checked={isDark} 
            onCheckedChange={onCheckedChange}
        />
    )
}
