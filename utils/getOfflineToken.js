import shopify from './shopify.js';

function getSessionTokenHeader(request) {
	return request.headers['authorization']?.replace('Bearer ', '');
}
  
function getSessionTokenFromUrlParam(request) {
const searchParams = new URLSearchParams(request.url);

return searchParams.get('id_token');
}

export const getOfflineAccessToken = async (req, res) => {
	console.log('getOfflineAccessToken')
	try {

		console.log("req.query =>", req.query);
		const shop = new URLSearchParams(request.url).get('shop');
		const shop2 = shopify.utils.sanitizeShop(session.shop, true);
		console.log("shop =>", shop)
		console.log("shop2 =>", shop2);


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