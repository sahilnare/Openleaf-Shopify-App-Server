import SessionModel from "../../utils/models/SessionModel.js";
import StoreModel from "../../utils/models/StoreModel.js";

/**
 * @typedef { import("../../_developer/types/2024-01/webhooks.js").LOCATIONS_UPDATE } webhookTopic
 */

const openleafOrderCreated = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  /** @type {webhookTopic} */
  const webhookBody = JSON.parse(webhookRequestBody);

  logger.info({'new location is created with shop =>': shop, body: webhookBody})
};

export default openleafOrderCreated;
