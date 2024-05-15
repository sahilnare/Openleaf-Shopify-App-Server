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
// import logger from "../logger.js";
import { getOfflineAccessToken } from "../../utils/getOfflineToken.js";
// import logger from "../logger.js";

const authMiddleware = (app) => {

  app.get("/api/auth", async (req, res) => {

    req?.query?.shop && console.log(`${req.query.shop} tried to install openleaf shopify app`)

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

      console.log('start page 1')

			return await shopify.auth.begin({
        shop: req.query.shop,
        callbackPath: "/api/auth/tokens",
        isOnline: false,
        rawRequest: req,
        rawResponse: res,
			});

		} catch (e) {

      const { shop } = req.query;
			// logger.error({'Error at /api/auth': `shop: ${shop}`, error: e});
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

    console.log('start page 2')
    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

      const { session } = callbackResponse;
      
      console.log(`${req.query.shop} install openleaf shopify app`)

      await sessionHandler.storeSession(session);
      
      // try {

      //   const {rows} = await query('SELECT * FROM shopify_saved_tokens WHERE store_url = $1', [`https://${session.shop}/`])

      //   if (rows.length === 0) {

      //     await query('INSERT INTO shopify_saved_tokens (shopify_access_token, store_url) VALUES ($1, $2);', [session.accessToken, `https://${session.shop}/`]);

      //   } else if (session.accessToken !== rows[0].shopify_access_token) {

      //     await query('UPDATE shopify_saved_tokens SET shopify_access_token = $1 WHERE store_url = $2', [session.accessToken, `https://${session.shop}/`])
      
      //   }
        
      // } catch (error) {

      //   logger.error({'Postgress error =>': error})

      // }

      await shopify.webhooks.register({
        session,
      });

      // logger.info({'Webhook registered of shop': session.shop});

      // # Get shopify offline access token
      const offline_access_token = await getOfflineAccessToken(req);

      if (!offline_access_token) {
        res.status(400).json({
          status: false,
          message: 'Offline access token not found'
        })
        return;
      }
    
      // logger.info({'Offline access token => ': `${offline_access_token} of ${req.query.shop}`})
      console.log('offline access token', offline_access_token);
    
      try {
        
        await query('INSERT INTO shopify_saved_tokens (shopify_access_token, store_url) VALUES ($1, $2)', [offline_access_token, `https://${shop}/`])
        // return res.status(200).json({
        //   status: true,
        //   message: "Offline Access token succesfully saved"
        // })
    
        return res.redirect(`https://dashboard.openleaf.tech/`)
    
      } catch (error) {
    
        // logger.info({'Postgre Sql error =>': error})
        console.log('postgre =>', error);
        return res.status(400).json({
          status: false,
          message: 'SQL error'
        })
    
      }

      return await shopify.auth.begin({
        shop: session.shop,
        callbackPath: "/api/auth/callback",
        isOnline: true,
        rawRequest: req,
        rawResponse: res,
      });

    } catch (e) {

      const { shop } = req.query;
      // logger.error({'Error at /api/auth/tokens': `shop: ${shop}`, error: e});

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

    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

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

      const { shop } = req.query;
      // logger.error({'Error at /api/auth/callback': `shop: ${shop}`, error: e});
      
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
