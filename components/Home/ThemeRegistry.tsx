"use client";

import { createTheme,ThemeProvider } from "@mui/material";
import {CssBaseline} from "@mui/material";
import { themeOptions } from "@/styles/themeOptions";

export default function ThemeRegistry({children}:{children:React.ReactNode}){
  const theme = createTheme(themeOptions);

  return (
    <ThemeProvider theme = {theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}