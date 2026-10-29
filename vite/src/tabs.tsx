import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";
import * as serviceWorker from "./serviceWorker";
import { lightTheme, ThemeProvider } from "./styles/theme";
import TabsPage from "./pages/Tabs";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={lightTheme} focusVisibleRef={null}>
    <TabsPage />
  </ThemeProvider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
