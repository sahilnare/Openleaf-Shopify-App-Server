import query from "../../utils/dbConnect.js";
import logger from "../logger.js";

/**
 * @typedef { import("../../_developer/types/2024-01/webhooks.js").ORDERS_UPDATED } webhookTopic
 */

const openleafOrderUpdated = async (
  topic,
  shop,
  webhookRequestBody,
  apiVersion
) => {
  /** @type {webhookTopic} */

  try {

    if (shop === 'ghar-soaps.myshopify.com') {

      return;

    }
    
    const { rows } = await query(
      "SELECT webhook_id FROM shopify_users WHERE store_url = $1",
      [`https://${shop}/`]
    );

    if (rows.length === 0) {
      logger.error({ "User not registered with shop:": shop });
      return;
    }

    const webhookId = rows[0].webhook_id;
    const url = `https://api.openleaf.tech/api/v1/shopifyWebHook/orderUpdate/${webhookId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: webhookRequestBody,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorBody}`
      );
    }

    logger.info({ "Order update webhook successfully forwarded for shop:": shop });
  } catch (error) {
    logger.error({
      "Error processing ORDER_UPDATED webhook for shop": shop,
      "error": error.message,
    });
  }
};

export default openleafOrderUpdated;
