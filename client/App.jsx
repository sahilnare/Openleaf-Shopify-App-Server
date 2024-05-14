import { AppProvider as PolarisProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { useNavigate, useRoutes } from "raviger";
import routes from "./Routes";
// import AppBridgeProvider from "./providers/AppBridgeProvider";
import { AppBridgeProvider, ShopifyProvider } from "@shopify/app-bridge-react";

// import App

export default function App() {
  const RouteComponents = useRoutes(routes);
  const { apiKey } = useLoaderData();

//   const navigate = useNavigate();
  // navigate('https://dashboard.openleaf.tech/admin/dashboard');

  return (
    <PolarisProvider i18n={translations}>
      <AppBridgeProvider isEmbeddedApp apiKey={apiKey} >
        {/* <ui-nav-menu>
          <a href="/debug/data">Fetch Data</a>
          <a href="/debug/billing">Billing API</a>
        </ui-nav-menu> */}
        {RouteComponents}
      </AppBridgeProvider>
    </PolarisProvider>
  );
}
