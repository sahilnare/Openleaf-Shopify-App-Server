import { Router } from "express";
import clientProvider from "../../utils/clientProvider.js";
import argon2 from 'argon2'
import query from "../../utils/dbConnect.js";

const userRoutes = Router();

userRoutes.get("/", (req, res) => {
  const sendData = { text: "This is coming from /apps/api route." };
  return res.status(200).json(sendData);
});

userRoutes.post("/", (req, res) => {
  return res.status(200).json(req.body);
});

userRoutes.get("/debug/gql", async (req, res) => {
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
  console.log('req.query in login credentials', req?.query);
  console.log('query => ', req?.query?.email, req?.query?.password);
  const {email, password, shop, apikey} = req.query;

  try {
    
    const { rows } = await query('SELECT * FROM client_users WHERE email = $1', [email])
    if (rows.length === 0) {

      return res.status(401).json({message: 'Invallid Credentials'});

    }

    // # Getting Error don't know why -> Logical error
    // const { rows: shopify_user_rows } = await query('SELECT * FROM shopify_users WHERE store_url = $1', [`https://${shop}/`])
    // if (shopify_user_rows !== 0) {
    //   return res.status(200).json({message: 'User already present!'});
    // }

    if (await argon2.verify(rows[0].password, password)) {

      // # Get JWT token
      const user_id = rows[0].user_id;

      const { rows: rows1 } = await query('SELECT * FROM shopify_saved_tokens WHERE store_url = $1', [`https://${shop}/`])

      if (rows1.length === 0) {
        return res.status(401).json({message: 'No shop present in database'});
      }

      const shopify_access_token = rows1[0].shopify_access_token;

      await query('INSERT INTO shopify_users (user_id, email, shopify_api_key, shipping_mode, shopify_access_token, store_url) VALUES ($1, $2, $3, $4, $5, $6)', [
        user_id,
        email,
        apikey,
        'manual',
        shopify_access_token,
        `https://${shop}/`
      ])

      const url = `https://${shop}/admin/api/2024-01/locations.json`;

      const options = {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': `${shopify_access_token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await fetch(url, options);

      const result = await response.json();
      console.log(result, result?.data);
      const locations = result?.data?.locations;

      const { rows: pickup_locations_rows } = await query('SELECT * FROM pickup_locations WHERE user_id = $1', [user_id]);
      const wareHouseName = pickup_locations_rows[0].warehouse_name;
      
      if (pickup_locations_rows.length === 0) {

        return res.status(400).json(`No pickup location found `);

      }

      let shopify_location_query = `INSERT INTO shopify_locations (shopify_assigned_location, user_id, pickup_location) VALUES `
      const insertValue = []
      let startValue = 0;
      for (let index = 1; index <= locations?.length; index+= 1) {
        shopify_location_query += `($${index + startValue}, $${index + startValue + 1}, $${index + startValue + 2})`;
        if (index !== locations.length) {
          shopify_location_query += ', '
        }
        insertValue.push(locations[index-1].name, user_id, wareHouseName)	
        startValue += 2
      }
    
      console.log('Inserting location values', shopify_location_query, insertValue);
      await query(shopify_location_query, insertValue)

      return res.status(201).json({message: 'Shopify User successfully created.'})

    } else {

      return res.status(401).json({message: 'Invallid Credentials'});

    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({error})
  }
  
})

userRoutes.get('/islogin', async (req, res) => {
  console.log('req.query in islogin =>', req?.query);

  const { shop } = req.query;
  try {
    
    const { rows } = await query('SELECT * FROM shopify_users WHERE store_url = $1', [`https://${shop}/`])
    if (rows.length === 0) {
      return res.status(401).json({message: "Shop not present", isUser: false})
    } else {
      return res.status(200).json({message: "User already present with this shop", isUser: true})
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({error, isUser: false})
  }
})

export default userRoutes;
