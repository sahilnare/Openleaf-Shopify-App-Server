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
import logger from "../logger.js";
import { getOfflineAccessToken } from "../../utils/getOfflineToken.js";

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

			return await shopify.auth.begin({
        shop: req.query.shop,
        callbackPath: "/api/auth/tokens",
        isOnline: false,
        rawRequest: req,
        rawResponse: res,
			});

		} catch (e) {

      const { shop } = req.query;
			logger.error({'Error at /api/auth': `shop: ${shop}`, error: e});
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

    console.log(req.headers);
    console.log('req.url in token =>', req.url)

    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

      const { session } = callbackResponse;
      
      console.log(`${req.query.shop} install openleaf shopify app`)

      await sessionHandler.storeSession(session);
      
      console.log('sesssionHandler offline access token => ', session.accessToken);
      logger.info({'Session.accessToken': session.accessToken, "for shop": session.shop});

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

      logger.info({'Webhook registered of shop': session.shop});

      return res.redirect(`https://dashboard.openleaf.tech/auth/login?shop=${session.shop}&accessToken=${session.accessToken}`)

      return await shopify.auth.begin({
        shop: session.shop,
        callbackPath: "/api/auth/callback",
        isOnline: true,
        rawRequest: req,
        rawResponse: res,
      });

    } catch (e) {

      const { shop } = req.query;
      logger.error({'Error at /api/auth/tokens': `shop: ${shop}`, error: e});

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

    console.log('callback req.headers =>', req.headers)
    console.log('callback url =>', req.url)
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
      logger.error({'Error at /api/auth/callback': `shop: ${shop}`, error: e});
      
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
