import {
  BotActivityDetected,
  CookieNotFound,
  InvalidOAuthError,
  InvalidSession,
} from "@shopify/shopify-api";
import StoreModel from "../../utils/models/StoreModel.js";
import sessionHandler from "../../utils/sessionHandler.js";
import shopify from "../../utils/shopify.js";
import query from "../../utils/dbConnect.js";

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
    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

	  console.log("This is /api/auth/tokens");

      const { session } = callbackResponse;

      await sessionHandler.storeSession(session);
      
      // Error may occur here
      // try {
      //   await query('INSERT INTO shopify_users (shopify_access_token, store_url) VALUES ($1, $2);', [session.id, session.shop]);
        
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
