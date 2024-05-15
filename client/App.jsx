import { AppProvider as PolarisProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import { useNavigate, useRoutes } from "raviger";
import routes from "./Routes";
import AppBridgeProvider from "./providers/AppBridgeProvider";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions"

export default function App() {

  const app = useAppBridge();
  const redirect = Redirect.create(app);

  const RouteComponents = useRoutes(routes);

  redirect.dispatch(Redirect.Action.REMOTE, '/otherpage?somequeryparam=123');

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
