import query from "../../utils/dbConnect.js";
import SessionModel from "../../utils/models/SessionModel.js";
import StoreModel from "../../utils/models/StoreModel.js";
import logger from "../logger.js";

/**
 * @typedef { import("../../_developer/types/2023-10/webhooks.js").APP_UNINSTALLED } webhookTopic
 */

const appUninstallHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  /** @type {webhookTopic} */

  try {
    
    await query('DELETE FROM shopify_saved_tokens WHERE store_url = $1', [`https://${shop}/`]);

  } catch (error) {
    
    logger.info({'Postgre Sql error =>': error});

  }

  // let user_id;

  // try {
    
  //   const { rows } = await query('DELETE FROM shopify_users WHERE store_url = $1 RETURNING user_id', [`https://${shop}/`]);

  //   console.log('webhookREqBody', webhookRequestBody, webhookId, apiVersion);
  //   user_id = rows[0].user_id;

  //   logger.info({"Shopify User deleted with user_id =>": user_id});

  //   try {
      
  //     await query('DELETE FROM shopify_locations WHERE user_id = $1', [user_id]);

  //     logger.info({"Location deleted with user_id =>": user_id});

  //   } catch (error) {
      
  //     logger.error({"Error in deleting locations with user_id =>": user_id});

  //   }

  //   try {
      
  //     await query('DELETE FROM shopify_packaging WHERE user_id = $1', [user_id]);

  //     logger.info({"Packaging deleted with user_id =>": user_id});

  //   } catch (error) {
      
  //     logger.error({"Error in deleting packaging with user_id =>": user_id});

  //   }

  // } catch (error) {
    
  //   logger.error({"Error in deleting shopify user with user_id": user_id});

  // }
  
};

export default appUninstallHandler;
