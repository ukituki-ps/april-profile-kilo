import "@mantine/core/styles.css";
import "@xyflow/react/dist/style.css";
import ReactDOM from "react-dom/client";
import { AprilProviders } from "@april/ui";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { getResolvedApiBaseUrl, isDemoMswEnabled } from "./mocks/demoEnv";

void (async () => {
  if (isDemoMswEnabled()) {
    const { startDemoMockWorker } = await import("./mocks/browser");
    await startDemoMockWorker(getResolvedApiBaseUrl());
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <AprilProviders defaultColorScheme="dark">
        <App />
      </AprilProviders>
    </BrowserRouter>,
  );
})();
