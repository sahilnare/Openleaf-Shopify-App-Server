import logger from "../logger.js";
import query from "../../utils/dbConnect.js";

/**
 * @typedef { import("../../_developer/types/2024-01/webhooks.js").ORDERS_CREATE } webhookTopic
 */

const openleafOrderCreated = async (
  topic,
  shop,
  webhookRequestBody,
  apiVersion
) => {
  /** @type {webhookTopic} */

  try {
    const { rows } = await query(
      "SELECT webhook_id, shopify_access_token FROM shopify_users WHERE store_url = $1",
      [`https://${shop}/`]
    );

    if (rows.length === 0) {
      logger.error({ "User not registered with shop:": shop });
      return;
    }

    const webhookId = rows[0].webhook_id;
    const url = `https://api.openleaf.tech/api/v1/shopifyWebHook/order/${webhookId}`;

    const response = await fetch(url, {
      method: "POST",
      body: webhookRequestBody,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorBody}`
      );
    }

    logger.info({ "Order create webhook successfully forwarded for shop:": shop });
  } catch (error) {
    logger.error({
      "Error processing ORDER_CREATE webhook for shop": shop,
      "error": error.message,
    });
  }
};

export default openleafOrderCreated;
