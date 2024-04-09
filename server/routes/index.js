import { Router } from "express";
import clientProvider from "../../utils/clientProvider.js";
import argon2 from 'argon2'
import shopify from "../../utils/shopify.js";
import openleafOrderCreated from "../webhooks/openleaf_order_create.js";
import { DeliveryMethod } from "@shopify/shopify-api";
import openleafOrderUpdated from "../webhooks/openleaf_order_update.js";
import { insertShopifyLocation, insertShopifyPackaging, insertShopifyUser } from "./insertHandler.js";
import logger from "../logger.js";

import query from "../../utils/dbConnect.js";
import { getOfflineAccessToken } from '../../utils/getOfflineToken.js';
const userRoutes = Router();

userRoutes.get("/", (req, res) => {
	console.log('/api/apps/ get userRoutes', req?.headers)
  const sendData = { text: "This is coming from /apps/api route." };
  return res.status(200).json(sendData);
});

userRoutes.post("/", (req, res) => {
	console.log('/api/apps/ post userRoutes', req?.headers)
  return res.status(200).json(req.body);
});

userRoutes.get("/debug/gql", async (req, res) => {
	console.log('/api/apps/debug/gql userRoutes')
  //false for offline session, true for online session
  const { client } = await clientProvider.graphqlClient({
    req,
    res,
    isOnline: false,
  });

  const shop = await client.request(
    `{
      shop {
        name
      }
    }`
  );

  return res.status(200).json({ text: shop.data.shop.name });
});

userRoutes.get("/debug/activeWebhooks", async (req, res) => {
	console.log('/api/apps/debug/activeWebhooks userRoutes')
  const { client } = await clientProvider.graphqlClient({
    req,
    res,
    isOnline: true,
  });
  const activeWebhooks = await client.request(
    `{
      webhookSubscriptions(first: 25) {
        edges {
          node {
            topic
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
        }
      }
    }`
  );
  return res.status(200).json(activeWebhooks);
});

userRoutes.get("/debug/getActiveSubscriptions", async (req, res) => {
  const { client } = await clientProvider.graphqlClient({
    req,
    res,
    isOnline: true,
  });
  const response = await client.request(
    `{
      appInstallation {
        activeSubscriptions {
          name
          status
          lineItems {
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  __typename
                  price {
                    amount
                    currencyCode
                  }
                  interval
                }
              }
            }
          }
          test
        }
      }
    }`
  );

  res.status(200).send(response);
});

userRoutes.get("/debug/createNewSubscription", async (req, res) => {
  const { client, shop } = await clientProvider.graphqlClient({
    req,
    res,
    isOnline: true,
  });
  const returnUrl = `${process.env.SHOPIFY_APP_URL}/api/auth?shop=${shop}`;

  const planName = "$10.25 plan";
  const planPrice = 10.25; //Always a decimal

  const response = await client.request(
    `mutation CreateSubscription{
    appSubscriptionCreate(
      name: "${planName}"
      returnUrl: "${returnUrl}"
      test: true
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount: ${planPrice}, currencyCode: USD }
            }
          }
        }
      ]
    ) {
      userErrors {
        field
        message
      }
      confirmationUrl
      appSubscription {
        id
        status
      }
    }
  }
`
  );

  if (response.data.appSubscriptionCreate.userErrors.length > 0) {
    console.log(
      `--> Error subscribing ${shop} to plan:`,
      response.data.appSubscriptionCreate.userErrors
    );
    res.status(400).send({ error: "An error occured." });
    return;
  }

  return res.status(200).send({
    confirmationUrl: `${response.data.appSubscriptionCreate.confirmationUrl}`,
  });
});

userRoutes.get("/login/credentials", async (req, res) => {
	console.log('/login/credentials')

  	const {email, password, shop, apikey} = req.query;
	
	console.log("email, password, shop, apikey  => ", email, password, shop, apikey)

	try {
    const offline_access_token = await getOfflineAccessToken(req);

    console.log('offline_access_token => ', offline_access_token);
    
  } catch (error) {
    
    console.log('Token exchange error => ', error)
    
  }

//   try {
    
//     const { rows } = await query('SELECT * FROM client_users WHERE email = $1', [email])
//     if (rows.length === 0) {

//       return res.status(401).json({message: 'Invallid Credentials'});

//     }

//     if (await argon2.verify(rows[0].password, password)) {

//       // # Get JWT token
//       const user_id = rows[0].user_id;

//       const { rows: rows1 } = await query('SELECT * FROM shopify_saved_tokens WHERE store_url = $1', [`https://${shop}/`])

//       if (rows1.length === 0) {
//         return res.status(401).json({message: 'No shop present in database'});
//       }

//       const shopify_access_token = rows1[0].shopify_access_token;

//       const webhookId = await insertShopifyUser(user_id, email, apikey, 'manual', shopify_access_token, `https://${shop}/`)

//       // try {
//       //   shopify.webhooks.addHandlers({
//       //     ORDERS_CREATE: {
//       //       deliveryMethod: DeliveryMethod.Http,
//       //       callbackUrl: `https://api.openleaf.tech/api/v1/shopifyWebHook/order/${webhookId}`,
//       //       callback: openleafOrderCreated
//       //     },
//       //     ORDERS_UPDATED: {
//       //       deliveryMethod: DeliveryMethod.Http,
//       //       callbackUrl: `https://api.openleaf.tech/api/v1/shopifyWebHook/orderUpdate/${webhookId}`,
//       //       callback: openleafOrderUpdated
//       //     }
//       //   })
//       // } catch (error) {
//       //   console.log('Error in setting webhook', error)
//       // }

//       await insertShopifyPackaging(user_id);

//       const url = `https://${shop}/admin/api/2024-01/locations.json`;
//       const options = {
//         method: 'GET',
//         headers: {
//           'X-Shopify-Access-Token': `${shopify_access_token}`,
//           'Content-Type': 'application/json'
//         }
//       };

//       const response = await fetch(url, options);

//       const result = await response.json();
//       const locations = result?.locations;

//       const { rows: pickup_locations_rows } = await query('SELECT * FROM pickup_locations WHERE user_id = $1', [user_id]);
      
//       if (pickup_locations_rows.length === 0) {

//         return res.status(400).json(`No pickup location found `);

//       }

//       const wareHouseName = pickup_locations_rows[0].warehouse_name;

//       await insertShopifyLocation(wareHouseName, locations, user_id);

//       return res.status(201).json({message: 'Shopify User successfully created.'})

//     } else {

//       return res.status(401).json({message: 'Invallid Credentials'});

//     }

//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({error})
//   }
  
})

userRoutes.get('/islogin', async (req, res) => {
  const { shop } = req.query;
  // try {
    
  //   const { rows } = await query('SELECT * FROM shopify_users WHERE store_url = $1', [`https://${shop}/`])
  //   if (rows.length === 0) {
  //     return res.status(401).json({message: "Shop not present", isUser: false})
  //   } else {
  //     return res.status(200).json({message: "User already present with this shop", isUser: true})
  //   }

  // } catch (error) {
  //   console.log(error);
  //   return res.status(500).json({error, isUser: false})
  // }
  return res.status(500).json({message: 'Testing', isUser: false})
})

userRoutes.get('/syncOrders', async (req, res) => {
  console.log('syncing orders => ', req?.query);

  const { shop } = req?.query;
    
  const url = `https://${shop}/admin/api/2024-01/orders.json?status=any`
  // const accessToken = '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';

  // const url = `${store_url}/admin/oauth/access_scopes.json`

  const { rows } = await query('SELECT webhook_id, shopify_access_token FROM shopify_users WHERE store_url = $1', [`https://${shop}/`]);
  console.log('rows -> ', rows);

  if (rows.length === 0) {
    return res.status(400).json({message: "User not present", isUser: false})
  }
  const webhookId = rows[0].webhook_id;
  const accessToken = rows[0].shopify_access_token;



  const options = {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': `${accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log('result => ', result);
    logger.info({'shopifyOrders': {
        orders: result?.orders
    }});
  
    const ordersArray = result?.orders;

    try {
      
      const bulkOrderRes = await Promise.all(ordersArray.map(async (order, order_index) => {
  
        const url = `https://api.openleaf.tech/api/v1/shopifyWebHook/order/${webhookId}`;
    
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order)
        };
    
        const response = await fetch(url, options);
    
        const result = await response.json();
        console.log('order created with weebhookId => ', webhookId, response.ok);
      }));
  
      return res.status(201).json({message: 'Bulk Order created!', bulkOrderRes})

    } catch (error) {

      return res.status(500).json({message: "Server Error", error})
      
    }  

  } catch (error) {
    return res.status(500).json({message: "Shopify Server Error", error})
  }

})

userRoutes.get('/temp/url', async (req, res) => {
  console.log('temp/url headers =>', req?.headers)
  console.log('temp/url query => ', req.query)
  
  console.log('in temp url')
  return res.status(200).json({msg: 'hello'})
})

export default userRoutes;
