import { createRoot } from "react-dom/client";
import App from "./App";

window.location.replace('https://dashboard.openleaf.tech/')

const root = createRoot(document.getElementById("shopify-app"));
root.render(<App />);
