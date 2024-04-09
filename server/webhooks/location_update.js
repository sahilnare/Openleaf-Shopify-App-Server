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

  console.log("Location webhook is created!!!!!");
  console.log("Here is the order body:");
  console.log(webhookRequestBody);
  console.log('webhook info => ', topic, shop, webhookId, apiVersion);
//   await StoreModel.findOneAndUpdate({ shop }, { isActive: false });
//   await SessionModel.deleteMany({ shop });
};

export default openleafOrderCreated;
