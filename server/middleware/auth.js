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
import { crypto } from "@shopify/shopify-api/runtime";
import querystring from 'querystring';
import query from "../../utils/dbConnect.js";

function getSessionTokenHeader(request) {
  return request.headers['authorization']?.replace('Bearer ', '');
}

function getSessionTokenFromUrlParam(request) {
  const searchParams = new URLSearchParams(request.url);

  return searchParams.get('id_token');
}

const authMiddleware = (app) => {

  app.get("/api/auth", async (req, res) => {
    console.log('/api/auth/ query => ', req?.query);
    console.log('/api/auth headesr => ', req.headers)
		try {
			if (!req.query.shop) {
			return res.status(500).send("No shop provided");
			}

			if (req.query.embedded === "1") {
			const shop = shopify.utils.sanitizeShop(req.query.shop);
			const queryParams = new URLSearchParams({
				...req.query,
				shop,
				redirectUri: `https://${shopify.config.hostName}/api/auth?shop=${shop}`,
			}).toString();

			return res.redirect(`/exitframe?${queryParams}`);
			}

			return await shopify.auth.begin({
			shop: req.query.shop,
			callbackPath: "/api/auth/tokens",
			isOnline: true,
			rawRequest: req,
			rawResponse: res,
			});
		} catch (e) {
			console.error(`---> Error at /api/auth`, e);
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

  app.get("/api/auth/tokens", async (req, res) => {
    console.log('/api/auth/tokens query => ', req?.query);
    console.log('/api/auth/tokens headesr => ', req.headers)
    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

	    console.log("This is /api/auth/tokens");

      const { session } = callbackResponse;

      try {
        // const adminApiAccessToken = await shopify.config.adminApiAccessToken();
        const apiKey = await shopify.config.apiKey()
        const secretKey = await shopify.config.apiSecretKey();
        const a = await shopify.config.privateAppStorefrontAccessToken();
        console.log('Values => ', apiKey, secretKey, a);
      } catch (error) {
        console.log(error);
      }

      // * Experimental => Getting access token using shopifyApi => auth.tokenExchange
      try {
        
        const shop = shopify.utils.sanitizeShop(session.shop, true)

        const encodedSessionToken = getSessionTokenHeader(req) || getSessionTokenFromUrlParam(req) ||adminApiAccessToken || session.accessToken;

        console.log(encodedSessionToken);
        
        const tknExchange = await shopify.auth.tokenExchange({
          sessionToken: encodedSessionToken,
          shop,
          requestedTokenType: RequestedTokenType.OfflineAccessToken
        });

        console.log('token exchange => ',tknExchange)

      } catch (error) {
        console.log('token exchange error => ', error)
      }


      // * Experimental => Token exchange from Rest API => https://{shop}.myshopify.com/admin/oauth/access_token
      // try {
      //   const tknExchangeUrl = `https://${req.query.shop}/admin/oauth/access_token`;
        
      //   // const jwtToken = await shopify.session.decodeSessionToken(session.accessToken);
      //   // console.log('jwtToken', jwtToken)

      //   const response = await fetch(tknExchangeUrl, {
      //     method: "POST",
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'Accept': 'application/json'
      //     },
      //     body: JSON.stringify({
      //       client_id: process.env.SHOPIFY_API_KEY,
      //       client_secret: process.env.SHOPIFY_API_SECRET,
      //       grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      //       subject_token: req.query.code,
      //       subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
      //       requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token"
      //     })
      //   })
      //   const result = await response.json();
      //   console.log('Token exchange Rest API result => ', result);
      // } catch (error) {
      //   console.log('Token exchange Rest API error => ', error)
      // }

      // * GitHub Testing
      // const code = req.query.code;
      // console.log('api key ', process.env.SHOPIFY_API_KEY, process.env.SHOPIFY_API_SECRET);
      // try {
      //   const { query } = req;
      //   const { code, hmac, shop } = query;

      //   const map = JSON.parse(JSON.stringify(query));
      //   delete map['signature'];
      //   delete map['hmac'];

      //   const message = querystring.stringify(map);
      //   const generated_hash = crypto
      //     .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      //     .update(message)
      //     .digest('hex');

      //   if (generated_hash !== hmac) {
      //     return response.status(400).send('HMAC validation failed');
      //   }

      //   if (shop == null) {
      //     return response.status(400).send('Expected a shop query parameter');
      //   }

      //   const requestBody = querystring.stringify({
      //     code,
      //     client_id: process.env.SHOPIFY_API_KEY,
      //     client_secret: process.env.SHOPIFY_API_SECRET,
      //   });

      //   const remoteResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/x-www-form-urlencoded',
      //       'Content-Length': Buffer.byteLength(requestBody),
      //     },
      //     body: requestBody,
      //   });

      //   const responseBody = await remoteResponse.json();
      //   const accessToken = responseBody.access_token;
      //   console.log('AccessToken', accessToken);
      // } catch (error) {
      //   console.log('Rest api error =>', error)
      // }

      await sessionHandler.storeSession(session);
      
      try {
          const {rows} = await query('SELECT * FROM shopify_saved_tokens WHERE store_url = $1', [`https://${session.shop}/`])
        if (rows.length === 0) {

          await query('INSERT INTO shopify_saved_tokens (shopify_access_token, store_url) VALUES ($1, $2);', [session.accessToken, `https://${session.shop}/`]);

        } else if (session.accessToken !== rows[0].shopify_access_token) {

          await query('UPDATE shopify_saved_tokens SET shopify_access_token = $1 WHERE store_url = $2', [session.accessToken, `https://${session.shop}/`])
      
        }
        
      } catch (error) {
        console.log('Postgress error =>', error)
      }
  	  console.log(session);
	  // # Have to save Shopify Access Token here

      const webhookRegisterResponse = await shopify.webhooks.register({
        session,
      });
      console.log('Registered for webhooks');
      // console.log(webhookRegisterResponse);
      // console.dir(webhookRegisterResponse, { depth: null });

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
    console.log('/api/auth/callback headers => ', res.headers);
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

// * Experimental => Getting data using /api/configdatashow
// try {
//   const apiUrl = `https://${session.shop}/api/configdatashow`;
//   const response = await fetch(apiUrl, {
//     method: 'GET',
//     headers: {
//     'Content-Type': 'application/json',
//     'X-Shopify-Access-Token': req?.query.code,
//   },
//   })
//   const result = await response.json();
//   console.log('API configshow data response => ', result);
// } catch (error) {
//   console.log('API configshow data error => ', error);
// }