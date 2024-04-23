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

  const { rows } = await query('SELECT webhook_id FROM shopify_users WHERE store_url = $1', [`https://${shop}/`]);

  console.log('rows in order updated =>', rows);

  if (rows.length !== 0) {

    const webhookId = rows[0].webhook_id;

    const url = `https://api.openleaf.tech/api/v1/shopifyWebHook/orderUpdate/${webhookId}`

    try {
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: webhookRequestBody
      });

    } catch (error) {

      logger.error({ 'Openleaf Server Error:': { error }})

    }

    logger.info({ 'Order Updated in shop: ': shop })

  } else {

    logger.info({ 'User not Register with shop: ': shop })

  }
};

export default openleafOrderUpdated;
