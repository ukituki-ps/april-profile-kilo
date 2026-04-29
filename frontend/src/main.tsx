import "@mantine/core/styles.css";
import "./styles/shell-layout-overrides.css";
import "@xyflow/react/dist/style.css";
import ReactDOM from "react-dom/client";
import { AprilProviders } from "@april/ui";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AprilProviders defaultColorScheme="dark">
      <App />
    </AprilProviders>
  </BrowserRouter>,
);
