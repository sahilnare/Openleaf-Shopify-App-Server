import logger from '../server/logger.js';
import shopify from './shopify.js';
import { RequestedTokenType } from "@shopify/shopify-api";

function getSessionTokenHeader(request) {
	return request.headers['authorization']?.replace('Bearer ', '');
}
  
function getSessionTokenFromUrlParam(request) {
	const searchParams = new URLSearchParams(request.url);

	return searchParams.get('id_token');
}

export const getOfflineAccessToken = async (req) => {
	const shopName = req.query.shop;
	if (!shopName) return;

	try {

		shopify.utils.sanitizeShop(shopName, true);

		const encodedSessionToken = getSessionTokenHeader(req) || getSessionTokenFromUrlParam(req);

		const tknExchangeUrl = `https://${shopName}/admin/oauth/access_token`;
        
        const response = await fetch(tknExchangeUrl, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            client_id: process.env.SHOPIFY_API_KEY,
            client_secret: process.env.SHOPIFY_API_SECRET,
            grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
            subject_token: `${encodedSessionToken}`,
            subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
            requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token"
          })
        })
        const result = await response.json();
		
		return result.access_token;

	} catch (error) {
		logger.info({'getOfflineAccessToken error': error});
		return;
    }

}