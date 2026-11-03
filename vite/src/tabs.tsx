import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";
import * as serviceWorker from "./serviceWorker";
import { ThemeProvider } from "@zendeskgarden/react-theming";
import { lightTheme } from "./styles/theme";
import TabsPage from "./pages/Tabs";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={lightTheme}>
    <TabsPage />
  </ThemeProvider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
