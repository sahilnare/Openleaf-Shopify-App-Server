import SessionModel from "../../utils/models/SessionModel.js";
import StoreModel from "../../utils/models/StoreModel.js";

/**
 * @typedef { import("../../_developer/types/2023-10/webhooks.js").ORDERS_CREATE } webhookTopic
 */

const orderCreatedHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  /** @type {webhookTopic} */
  const webhookBody = JSON.parse(webhookRequestBody);

  console.log("Order is created!!!!!");
  console.log("Here is the order body:");
  console.log(webhookRequestBody);
//   await StoreModel.findOneAndUpdate({ shop }, { isActive: false });
//   await SessionModel.deleteMany({ shop });
};

export default orderCreatedHandler;
