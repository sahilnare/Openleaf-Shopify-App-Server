const AppBridgeProvider = ({ children }) => {
  if (typeof window !== "undefined") {
    const shop = window?.shopify?.config?.shop;
    console.log(shop, '=> ', window?.shopify)
    console.log('shopify config: => ', window?.shopify?.config?.config)
    if (!shop) {
      return <p>No Shop Provided</p>;
    }
  }

  return <>{children}</>;
};

export default AppBridgeProvider;
