import SessionModel from "../../utils/models/SessionModel.js";
import StoreModel from "../../utils/models/StoreModel.js";
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

  if (rows.length !== 0) {

    const webhookId = rows.webhook_id;

    const url = `https://api.openleaf.tech/api/v1/shopifyWebHook/order/${webhookId}`

    try {
      
      const response = await fetch(url, {
        method: 'POST',
        body: webhookRequestBody
      })

    } catch (error) {

      console.log('Error in server =>', error);
      
    }

    // return res.status(200).json({message: "Order Created"})
    console.log('Order Created')

  } else {

    // return res.status(200).json({message: "User not present with this shop"})
    console.log(`User not present with this shop: ${shop}`)

  }

};

export default openleafOrderCreated;
