import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";
import App from "./App";
import { Provider } from "jotai";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter } from "react-router-dom";
import AppTheme, { setTheme } from "./styles/theme";
import { store } from "./atoms/store";
import Notifier from "./components/Notifier";
import "./config";
import "firebase/firestore";

try {
  const userSettings = JSON.parse(
    localStorage.getItem("user-settings") || "{}"
  );
  setTheme(userSettings["ui/appTheme"]);
} catch (error) {
  console.log(error);
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider store={store}>
      <AppTheme>
        <Notifier />
        <App />
      </AppTheme>
    </Provider>
  </BrowserRouter>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
