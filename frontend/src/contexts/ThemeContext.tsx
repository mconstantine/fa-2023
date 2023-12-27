import {
  ThemeProvider as MuiThemeProvider,
  PaletteMode,
  createTheme,
} from "@mui/material"
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

interface ThemeContext {
  mode: PaletteMode
  setMode(mode: PaletteMode): void
}

const ThemeContext = createContext<ThemeContext>({
  mode: "light",
  setMode: () => {},
})

const themeMedia = "(prefers-color-scheme: dark)"

export function ThemeProvider(props: PropsWithChildren) {
  const [mode, setMode] = useState<PaletteMode>("light")

  const theme = createTheme({
    palette: { mode },
  })

  useEffect(() => {
    if (!("matchMedia" in window)) {
      return
    }

    function onThemeMediaChange(event: MediaQueryListEvent) {
      setMode(event.matches ? "dark" : "light")
    }

    const media = window.matchMedia(themeMedia)
    setMode(media.matches ? "dark" : "light")
    media.addEventListener("change", onThemeMediaChange)

    return () => {
      media.removeEventListener("change", onThemeMediaChange)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <MuiThemeProvider theme={theme}>{props.children}</MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

// Exporting the context would completely fuck up isolation, screw Vite's fast refresh
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContext {
  return useContext(ThemeContext)
}
