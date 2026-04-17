import "@mantine/core/styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { AprilProviders } from "@april/ui";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AprilProviders>
      <App />
    </AprilProviders>
  </React.StrictMode>,
);
