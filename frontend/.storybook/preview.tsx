import type { Decorator, Preview } from "@storybook/react"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"
import "../src/index.css"
import React, { PropsWithChildren, useEffect } from "react"
import { CssBaseline, PaletteMode } from "@mui/material"
import { ThemeProvider, useTheme } from "../src/contexts/ThemeContext"
import { MemoryRouter } from "react-router-dom"

function ThemedStory(props: PropsWithChildren<{ theme: PaletteMode }>) {
  const { setMode } = useTheme()

  useEffect(() => {
    setMode(props.theme)
  }, [props.theme])

  return props.children
}

const withTheme: Decorator = (story, context) => {
  const theme = context.globals.theme as PaletteMode

  return (
    <ThemeProvider>
      <CssBaseline />
      <ThemedStory theme={theme}>{story()}</ThemedStory>
    </ThemeProvider>
  )
}

const withRouter: Decorator = (story) => {
  return <MemoryRouter>{story()}</MemoryRouter>
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [withTheme, withRouter],
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          {
            value: "light",
            icon: "circlehollow",
            title: "light",
          },
          {
            value: "dark",
            icon: "circle",
            title: "dark",
          },
        ] satisfies Array<{ value: PaletteMode; icon: string; title: string }>,
        showName: true,
      },
    },
  },
}

export default preview
