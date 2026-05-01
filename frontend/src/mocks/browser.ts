import { setupWorker } from "msw/browser";
import { createDemoApiHandlers } from "./handlers";

export async function startDemoMockWorker(resolvedApiBase: string): Promise<void> {
  const worker = setupWorker(...createDemoApiHandlers(resolvedApiBase));
  await worker.start({
    onUnhandledRequest: "bypass",
  });
}
