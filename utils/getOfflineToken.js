function getSessionTokenHeader(request) {
	return request.headers['authorization']?.replace('Bearer ', '');
}
  
function getSessionTokenFromUrlParam(request) {
const searchParams = new URLSearchParams(request.url);

return searchParams.get('id_token');
}

const getOfflineAccessToken = async (req) => {
	try {
        
		const shop = shopify.utils.sanitizeShop(session.shop, true)

		const encodedSessionToken = getSessionTokenHeader(req) || getSessionTokenFromUrlParam(req);

		console.log("encodedSessionToken => ", encodedSessionToken);
		
		const tknExchange = await shopify.auth.tokenExchange({
			sessionToken: encodedSessionToken,
			shop,
			requestedTokenType: RequestedTokenType.OfflineAccessToken
		});

		console.log('token exchange => ',tknExchange)

		} catch (error) {
		console.log('token exchange error => ', error)
      }
}