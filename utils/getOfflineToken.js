import shopify from './shopify.js';
import { RequestedTokenType } from "@shopify/shopify-api";

function getSessionTokenHeader(request) {
	return request.headers['authorization']?.replace('Bearer ', '');
}
  
function getSessionTokenFromUrlParam(request) {
  const searchParams = new URLSearchParams(request.url);

  return searchParams.get('id_token');
}

export const getOfflineAccessToken = async (req, res) => {

	try {

		const shop = shopify.utils.sanitizeShop(req.query.shop, true);

		const encodedSessionToken = getSessionTokenHeader(req) || getSessionTokenFromUrlParam(req);

		const tknExchangeUrl = `https://${req.query.shop}/admin/oauth/access_token`;
        
    const jwtToken = await shopify.session.decodeSessionToken(encodedSessionToken);

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
        subject_token: encodedSessionToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token"
      })
    })
    const result = await response.json();

		return result.access_token;

	} catch (error) {
		logger.error({'token exchange error => ': error});
  }
}