import shopify from './shopify.js';

function getSessionTokenHeader(request) {
	return request.headers['authorization']?.replace('Bearer ', '');
}
  
function getSessionTokenFromUrlParam(request) {
const searchParams = new URLSearchParams(request.url);

return searchParams.get('id_token');
}

export const getOfflineAccessToken = async (req) => {
	console.log('getOfflineAccessToken')
	try {
        
		// const shop = shopify.utils.sanitizeShop(session.shop, true);

		const encodedSessionToken = getSessionTokenHeader(req) || getSessionTokenFromUrlParam(req);

		console.log("encodedSessionToken => ", encodedSessionToken);
		
		const tknExchange = await shopify.auth.tokenExchange({
			sessionToken: encodedSessionToken,
			shop,
			requestedTokenType: RequestedTokenType.OfflineAccessToken
		});

		return tknExchange;

		} catch (error) {
		console.log('token exchange error => ', error)
      }
}