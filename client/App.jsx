import { AppProvider as PolarisProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import { useNavigate, useRoutes } from "raviger";
import routes from "./Routes";
import AppBridgeProvider from "./providers/AppBridgeProvider";

export default function App() {
  const RouteComponents = useRoutes(routes);

//   const navigate = useNavigate();
//   navigate('https://dashboard.openleaf.tech/admin/dashboard');

  return (
    <PolarisProvider i18n={translations}>
      <AppBridgeProvider>
        {/* <ui-nav-menu>
          <a href="/debug/data">Fetch Data</a>
          <a href="/debug/billing">Billing API</a>
        </ui-nav-menu> */}
        {RouteComponents}
      </AppBridgeProvider>
    </PolarisProvider>
  );
}
