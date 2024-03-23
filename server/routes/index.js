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
  console.log('req.query in login credentials', req.query);
  // res.redirect('https://dashboard.openleaf.tech/admin/dashboard')
  // res.status(200).send({msg: 'User stored'})
  const {email, password, shop, apikey} = req.query;

  const { rows } = await query('SELECT * FROM client_users WHERE email = $1', [email])
  if (rows.length === 0) {

		return res.status(401).json({message: 'Invallid Credentials'});

	}

  if (await argon2.verify(rows[0].password, password)) {

		// # Get JWT token
		const { rows: rows1 } = await query('SELECT user_id FROM client_users WHERE email = $1', [email]);

    const user_id = rows1[0].user_id;


    await query('UPDATE shopify_users SET user_id = $1, email = $2, shopify_api_key = $3 WHERE store_url = $4', [user_id, email, apikey, shop]);
		return res.status(200).json({message: 'Login Succesfull'})

	} else {

		return res.status(401).json({message: 'Invallid Credentials'});

	}
  
})

export default userRoutes;
