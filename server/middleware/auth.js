import {
  BotActivityDetected,
  CookieNotFound,
  InvalidOAuthError,
  InvalidSession,
  shopifyApi,
  RequestedTokenType
} from "@shopify/shopify-api";
import StoreModel from "../../utils/models/StoreModel.js";
import sessionHandler from "../../utils/sessionHandler.js";
import shopify from "../../utils/shopify.js";
// import query from "../../utils/dbConnect.js";

const authMiddleware = (app) => {

  app.get("/api/auth", async (req, res) => {
    try {
      if (!req.query.shop) {
        return res.status(500).send("No shop provided");
      }

	  console.log("This is /api/auth");

	  console.log(req.query.shop);
	  console.log(req.query);
	  console.log(req.body);

      if (req.query.embedded === "1") {
        const shop = shopify.utils.sanitizeShop(req.query.shop);
		console.log("Sanitized shop");
		console.log(shop);
        const queryParams = new URLSearchParams({
          ...req.query,
          shop,
          redirectUri: `https://${shopify.config.hostName}/api/auth?shop=${shop}`,
        }).toString();

        return res.redirect(`/exitframe?${queryParams}`);
      }

	  const authResponse = await shopify.auth.begin({
        shop: req.query.shop,
        callbackPath: "/api/auth/tokens",
        isOnline: false,
        rawRequest: req,
        rawResponse: res,
      });

	  console.log(authResponse);

      return authResponse;

    } catch (e) {
      console.error(`---> Error at /api/auth`, e);
      const { shop } = req.query;
	  console.error(shop);
      switch (true) {
        case e instanceof CookieNotFound:
        case e instanceof InvalidOAuthError:
        case e instanceof InvalidSession:
          res.redirect(`/api/auth?shop=${shop}`);
          break;
        case e instanceof BotActivityDetected:
          res.status(410).send(e.message);
          break;
        default:
          res.status(500).send(e.message);
          break;
      }
    }
  });

  app.get("/api/auth/tokens", async (req, res) => {
    console.log('/api/auth/tokens query => ', req?.query);
    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

	    console.log("This is /api/auth/tokens");

      const { session } = callbackResponse;

      // * Experimental => Getting data using /api/configdatashow
      const apiUrl = `https://${session.shop}/api/configdatashow`;
      fetch(apiUrl, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken,
      },
      })
      .then((response) => response.json())
      .then((data) => {
        console.log('API response:', data); 
        // Process the data returned from the API
      })
      .catch((error) => {
        console.error('API error:', error);
      });

      // * Experimental => Getting access token using shopifyApi => auth.tokenExchange
      try {
        
        const shop = shopify.utils.sanitizeShop(session.shop, true)
        // const headerSessionToken = getSessionTokenHeader(request);
        // const searchParamSessionToken = getSessionTokenFromUrlParam(request);
        // const sessionToken = (headerSessionToken || searchParamSessionToken);
        const sessionToken = session.accessToken;
        
        const tknExchange = await shopify.auth.tokenExchange({
          sessionToken,
          shop,
          requestedTokenType: RequestedTokenType.OfflineAccessToken
        });

        console.log('token exchange => ',tknExchange)

      } catch (error) {
        console.log('token exchange error => ', error)
      }
        
      // * Experimental => Trying to get offline token using shopifyApi => auth.begin
      try {
        const authResponseTemp = await shopify.auth.begin({
          shop: session.shop,
          callbackPath: '/api/auth/tokens',
          isOnline: false,
          rawRequest: req,
          rawResponse: res
        })
    
        console.log('authResponse => ', authResponseTemp)
      } catch (error) {
        console.log('Begin error', error);
      }


      await sessionHandler.storeSession(session);
      
      // try {
        //   const {rows} = await query('SELECT * FROM shopify_saved_tokens WHERE store_url = $1', [`https://${session.shop}/`])
      //   if (rows.length === 0) {

      //     await query('INSERT INTO shopify_saved_tokens (shopify_access_token, store_url) VALUES ($1, $2);', [session.accessToken, `https://${session.shop}/`]);

      //   } else if (session.accessToken !== rows[0].shopify_access_token) {
        
      //     await query('UPDATE shopify_saved_tokens SET shopify_access_token = $1 WHERE store_url = $2', [session.accessToken, `https://${session.shop}/`])
      
      //   }
        
      // } catch (error) {
      //   console.log('Postgress error =>', error)
      // }
  	  console.log(session);
	  // # Have to save Shopify Access Token here

      const webhookRegisterResponse = await shopify.webhooks.register({
        session,
      });
      console.log('Registered for webhooks');
      console.log(webhookRegisterResponse);
      console.dir(webhookRegisterResponse, { depth: null });

      return await shopify.auth.begin({
        shop: session.shop,
        callbackPath: "/api/auth/callback",
        isOnline: true,
        rawRequest: req,
        rawResponse: res,
      });
    } catch (e) {
      console.error(`---> Error at /api/auth/tokens`, e);
      const { shop } = req.query;
      switch (true) {
        case e instanceof CookieNotFound:
          case e instanceof InvalidOAuthError:
        case e instanceof InvalidSession:
          res.redirect(`/api/auth?shop=${shop}`);
          break;
        case e instanceof BotActivityDetected:
          res.status(410).send(e.message);
          break;
        default:
          res.status(500).send(e.message);
          break;
      }
    }
  });

  app.get("/api/auth/callback", async (req, res) => {
    console.log('/api/auth/callback query => ', req?.query)
    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

	  console.log("This is /api/auth/callback");

      const { session } = callbackResponse;
      await sessionHandler.storeSession(session);

      const host = req.query.host;
      const { shop } = session;

      await StoreModel.findOneAndUpdate(
        { shop },
        { isActive: true },
        { upsert: true }
      ); //Update store to true after auth has happened, or it'll cause reinstall issues.

      return res.redirect(`/?shop=${shop}`);
    } catch (e) {
      console.error(`---> Error at /api/auth/callback`, e);
      const { shop } = req.query;
      switch (true) {
        case e instanceof CookieNotFound:
        case e instanceof InvalidOAuthError:
        case e instanceof InvalidSession:
          res.redirect(`/api/auth?shop=${shop}`);
          break;
        case e instanceof BotActivityDetected:
          res.status(410).send(e.message);
          break;
        default:
          res.status(500).send(e.message);
          break;
      }
    }
  });
};

export default authMiddleware;

// * Experimental => Getting data using Rest Api => /admin/oauth/authorize
// try {
//   const oAuthUrl = `https://${req.query.shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_API_SCOPES}&redirect_uri=${'https://shopifyapp.openleaf.tech/api/auth/callback'}`
//   const response = await fetch(oAuthUrl)
//   console.log('Getting data using /admin/oauth/authorize => ', response);
// } catch (error) {
//   console.log('Rest api error => /admin/oauth/authorize => ', error);
// }