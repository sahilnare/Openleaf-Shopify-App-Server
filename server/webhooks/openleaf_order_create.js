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

  
  const { rows } = await query('SELECT webhook_id, shopify_access_token FROM shopify_users WHERE store_url = $1', [`https://${shop}/`]);

  console.log('order create rows =>', rows);

  if (rows.length !== 0) {

    const webhookId = rows[0].webhook_id;

    const url = `https://api.openleaf.tech/api/v1/shopifyWebHook/order/${webhookId}`
    console.log('url =>', url);

    console.log('Order update body ->', webhookRequestBody);

    try {
      
      const response = await fetch(url, {
        method: 'POST',
        body: webhookRequestBody,
        headers: {
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {

      logger.error({ 'Openleaf Server Error:': { error }})
      
    }

    // return res.status(200).json({message: "Order Created"})
    logger.info({ 'Order Created in shop: ': shop })

  } else {

    // return res.status(200).json({message: "User not present with this shop"})
    logger.info({ 'User not present with this shop': shop })

  }

};

export default openleafOrderCreated;
