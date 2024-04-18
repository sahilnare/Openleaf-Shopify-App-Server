import { Router } from "express";
import clientProvider from "../../utils/clientProvider.js";
import argon2 from 'argon2'
import shopify from "../../utils/shopify.js";
import { insertShopifyLocation, insertShopifyPackaging, insertShopifyUserAndGetWebhookID } from "./insertHandler.js";
import logger from "../logger.js";

import query from "../../utils/dbConnect.js";
import { getOfflineAccessToken } from '../../utils/getOfflineToken.js';
const userRoutes = Router();

userRoutes.get("/", (req, res) => {
  
  const sendData = { text: "This is coming from /apps/api route." };
  return res.status(200).json(sendData);

});

userRoutes.post("/", (req, res) => {

  return res.status(200).json(req.body);

});

userRoutes.get("/debug/gql", async (req, res) => {

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
    logger.error({
      '--> Error subscribing to plan:':
      response.data.appSubscriptionCreate.userErrors,
      'shop': shop
    });
    res.status(400).send({ error: "An error occured." });
    return;
  }

  return res.status(200).send({
    confirmationUrl: `${response.data.appSubscriptionCreate.confirmationUrl}`,
  });

});


userRoutes.get("/login/credentials", async (req, res) => {

  	const {email, password, shop, apikey} = req.query;

	try {
		
		const { rows } = await query('SELECT * FROM client_users WHERE email = $1', [email])
		
		if (rows.length === 0) {

			return res.status(401).json({
				status: false,
				message: 'User not found'
			})

		}



		if (await argon2.verify(rows[0].password, password)) {

			// # Get shopify offline access token
			const offline_access_token = await getOfflineAccessToken(req);

			if (!offline_access_token) {
				res.status(400).json({
					status: false,
					message: 'Offline access token not found'
				})
				return;
			}

      logger.info({'Offline access token => ': `${offline_access_token} of ${shop}`})

			const user_id = rows[0].user_id;

			await query('INSERT INTO shopify_saved_tokens (shopify_access_token, store_url) VALUES ($1, $2)', [offline_access_token, `https://${shop}/`])

			const webhookId = await insertShopifyUserAndGetWebhookID(user_id, email, apikey, 'manual', offline_access_token, `https://${shop}/`)

			if (!webhookId) {

				logger.error({'Webhook Error': 'Failed to insert shopify user'})

				return res.status(400).json({
					status: false,
					message: 'Failed to insert shopify user & get webook id'
				})
			}

			await insertShopifyPackaging(user_id);

			const url = `https://${shop}/admin/api/2024-01/locations.json`;
			const options = {
				method: 'GET',
				headers: {
				'X-Shopify-Access-Token': `${offline_access_token}`,
				'Content-Type': 'application/json'
				}
			};

			try {
				const response = await fetch(url, options);			
				const result = await response.json();
				const locations = result?.locations;

				const { rows: pickup_locations_rows } = await query('SELECT * FROM pickup_locations WHERE user_id = $1', [user_id]);
			
				if (pickup_locations_rows.length === 0) {

					return res.status(400).json(`No pickup location found `);

				}

				const wareHouseName = pickup_locations_rows[0].warehouse_name;
		
				await insertShopifyLocation(wareHouseName, locations, user_id);

			} catch (error) {

				logger.error({'Error in getting locations': error})

				return res.status(500).json({
					status: false,
					message: 'Error in getting locations',
					error: error.message
				})

			}

			logger.info({'Shopify user created successfully with shop:': shop});

			return res.status(201).json({
				status: true,
				message: 'Shopify user created successfully'
			})

		} else {
			
      logger.error({'Shopify user login error with shop =>': shop})
			return res.status(401).json({
				status: false,
				message: 'Invalid Credentials'
			});

		}

	} catch (error) {

		logger.error({'Login error': error})
		return res.status(500).json({
			status: false,
            message: 'Internal server error',
            error: error.message
        })
	}
  
})

userRoutes.get('/islogin', async (req, res) => {

  const { shop } = req.query;

  try {
    
    const { rows } = await query('SELECT * FROM shopify_users WHERE store_url = $1', [`https://${shop}/`])

    if (rows.length === 0) {
      return res.status(401).json({message: "Shop not present", isUser: false})
    } else {
      return res.status(200).json({message: "User already present with this shop", isUser: true})
    }

  } catch (error) {

    logger.error({'Error at /islogin': error})
    return res.status(500).json({error, isUser: false})

  }

})

userRoutes.get('/syncOrders', async (req, res) => {

  logger.info({'syncing orders of ': req?.query?.shop});

  const { shop } = req?.query;
    
  const url = `https://${shop}/admin/api/2024-01/orders.json?status=any&limit=100`;

  const { rows } = await query('SELECT webhook_id, shopify_access_token FROM shopify_users WHERE store_url = $1', [`https://${shop}/`]);

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
        
      }));
  
      return res.status(201).json({message: 'Bulk Order created!', bulkOrderRes})

    } catch (error) {

      return res.status(500).json({message: "Server Error", error})
      
    }  

  } catch (error) {

    return res.status(500).json({message: "Shopify Server Error", error})

  }

})


export default userRoutes;
