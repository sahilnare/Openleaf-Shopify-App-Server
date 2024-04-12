import { DeliveryMethod, shopifyApi } from "@shopify/shopify-api";
import "dotenv/config";
import appUninstallHandler from "../server/webhooks/app_uninstalled.js";
// import orderCreatedHandler from "../server/webhooks/order_created.js";
import openleafOrderCreated from "../server/webhooks/openleaf_order_create.js";

import openleafLocationUpdate from "../server/webhooks/location_update.js";
import openleafLocationCreate from '../server/webhooks/openleaf_location_create.js';

const isDev = process.env.NODE_ENV === "dev";

// Setup Shopify configuration
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_API_SCOPES,
  hostName: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ""),
  hostScheme: "https",
  apiVersion: process.env.SHOPIFY_API_VERSION,
  isEmbeddedApp: true,
  logger: { level: isDev ? 1 : 0 }, //Error = 0,Warning = 1,Info = 2,Debug = 3
});

shopify.webhooks.addHandlers({
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/app_uninstalled",
    callback: appUninstallHandler,
  },
  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/order_created",
    callback: orderCreatedHandler,
  },
  LOCATIONS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: 'https://shopifyapp.openleaf.tech/api/webhooks/location_create',
    callback: openleafLocationCreate
  },
  LOCATIONS_UPDATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: 'https://shopifyapp.openleaf.tech/api/webhooks/location_create',
    callback: openleafLocationUpdate
  }
});

export default shopify;
