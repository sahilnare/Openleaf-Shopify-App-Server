import { Router } from "express";
import argon2 from 'argon2'
// import shopify from "../../utils/shopify.js";
import { insertShopifyLocation, insertShopifyPackaging, insertShopifyUserAndGetWebhookID } from "./insertHandler.js";
import logger from "../logger.js";

import query from "../../utils/dbConnect.js";
const complianceRoutes = Router();

complianceRoutes.get("/", (req, res) => {
  
  const sendData = { text: "This is coming from /apps/compliance route." };
  return res.status(200).json(sendData);

});

complianceRoutes.post("/", (req, res) => {

  return res.status(200).json(req.body);

});


complianceRoutes.get("/allData", async (req, res) => {

	const { shop } = req.query;

	const { rows } = await query('SELECT * FROM shopify_users WHERE store_url = $1', [`https://${shop}/`]);

    // console.log(rows);

	if (rows.length > 0) {

		user_id = rows[0].user_id;

   		logger.info({"Shopify User data fetch request with user_id =>": user_id});

	}
  
})

complianceRoutes.get('/dataDeleteRequest', async (req, res) => {

	const { shop } = req.query;

	const { rows } = await query('SELECT * FROM shopify_users WHERE store_url = $1', [`https://${shop}/`]);

    // console.log(rows);

	if (rows.length > 0) {

		user_id = rows[0].user_id;

   		logger.info({"Shopify User data deletion request with user_id =>": user_id});

	}

})


complianceRoutes.get('/shopDeleteRequest', async (req, res) => {

	const { shop } = req.query;

	const { rows } = await query('SELECT * FROM shopify_users WHERE store_url = $1', [`https://${shop}/`]);

    // console.log(rows);

	if (rows.length > 0) {

		user_id = rows[0].user_id;

   		logger.info({"Shopify User shop deletion request with user_id =>": user_id});

	}

})


export default complianceRoutes;
