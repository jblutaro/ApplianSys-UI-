import "@/shared/styles/index.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import ReactDOM from "react-dom/client";
import App from "@/app/App";
import { AppProviders } from "@/app/providers/AppProviders";

ReactDOM.createRoot(document.querySelector("#root")!).render(
  <AppProviders>
    <App />
  </AppProviders>,
);
