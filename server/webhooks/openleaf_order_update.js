import query from "../../utils/dbConnect.js";
import SessionModel from "../../utils/models/SessionModel.js";
import StoreModel from "../../utils/models/StoreModel.js";

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
  // const webhookBody = JSON.parse(webhookRequestBody);

  const { rows } = await query('SELECT webhook_id FROM shopify_users WHERE store_url = $1', [`https://${shop}/`]);

  if (rows.length !== 0) {

    const webhookId = rows.webhook_id;

    const url = `https://api.openleaf.tech/api/v1/shopifyWebHook/orderUpdate/${webhookId}`

    try {
      
      const response = await fetch(url, {
        method: 'POST',
        body: webhookRequestBody
      })

    } catch (error) {

      console.log('Error in server =>', error);

    }

    // return res.status(200).json({message: "Order Updated"})
    
    console.log(`Order Updated in shop: ${shop}`)

  } else {

    
    console.log(`User not present with this shop: ${shop}`)

  }
};

export default openleafOrderUpdated;
