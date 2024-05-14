import crypto from "crypto";
import shopify from "../../utils/shopify.js";
import logger from "../logger.js";

const verifyHmac = (req, res, next) => {
  try {
    
    const generateHash = crypto
      .createHmac("SHA256", process.env.SHOPIFY_API_SECRET)
      .update(JSON.stringify(req.body), "utf8")
      .digest("base64");
    const hmac = req.headers["x-shopify-hmac-sha256"];

    console.log('Hmac =>', generateHash, hmac);

    if (shopify.auth.safeCompare(generateHash, hmac)) {
      next();
    } else {
      return res.status(401).send();
    }

  } catch (e) {

    logger.error({'Error ini verify Hmac =>': e});
    return res.status(401).send();

  }
};

export default verifyHmac;
