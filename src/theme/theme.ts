"use client";
import "../sass/variables.scss";
import { cyan, grey, yellow, red } from "@mui/material/colors";

import { createTheme } from "@mui/material/styles";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    text: {
      primary: "#ffffff", // Red
      secondary: "#f0f0f0", // Yellow
      disabled: "#64ffda", // Cyan
    },
    action: {
      active: "#64ffda", // Cyan
      hover: "#00bfa5", // Dark Cyan
      selected: "#00bfa5", // Dark Cyan
      disabled: "#00bfa5", // Dark Cyan
      disabledBackground: "#64ffda", // Cyan
    },
    background: {
      default: cyan[900], // Cyan
      paper: cyan[900], // Dark Cyan
    },
    divider: "rgba(255, 255, 255, 0.12)",
    primary: {
      light: "#e5ffff", // Light Cyan
      main: "#00e5ff", // Cyan
      dark: cyan[900], // Dark Cyan
      contrastText: "#000",
    },
    secondary: {
      light: "#ffff6b", // Light Yellow
      main: "#ffea00", // Yellow
      dark: "#b3a900", // Dark Yellow
      contrastText: "#000",
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    text: {
      primary: "#000000", // Red
      secondary: "#c0c0c0", // Yellow
      disabled: "#00bfa5", // Dark Cyan
    },
    action: {
      active: "#00bfa5", // Dark Cyan
      hover: "#00e5ff", // Cyan
      selected: "#00e5ff", // Cyan
      disabled: "#00e5ff", // Cyan
      disabledBackground: "#e5ffff", // Light Cyan
    },
    background: {
      default: "#ffffff", // White
      paper: "#ffffff", // Light Grey
    },
    divider: "rgba(0, 0, 0, 0.12)",
    primary: {
      light: "#e5ffff", // Light Cyan
      main: "#ffffff", // Cyan
      dark: "#ffffff", // Dark Cyan
      contrastText: "#000",
    },
    secondary: {
      light: "#ffff6b", // Light Yellow
      main: "#ffea00", // Yellow
      dark: "#b3a900", // Dark Yellow
      contrastText: "#000",
    },
  },
});
