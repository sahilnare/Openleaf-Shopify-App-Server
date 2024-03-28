import query from "../../utils/dbConnect.js";

export const insertShopifyUser = async (user_id, email, shopifyApiKey, shippingMode, shopifyAccessToken, shopUrl) => {

    const { rows: shopify_user_rows} = await query('INSERT INTO shopify_users (user_id, email, shopify_api_key, shipping_mode, shopify_access_token, store_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING webhook_id', [
        user_id,
        email,
        shopifyApiKey,
        shippingMode,
        shopifyAccessToken,
        shopUrl
      ])

    const webhookId = shopify_user_rows[0].webhook_id;

    return webhookId;

}

export const insertShopifyPackaging = async (user_id) => {
    
    await query('INSERT INTO shopify_packaging (user_id, package_dimensions) VALUES($1, $2)', [
        user_id,
        JSON.stringify({
          height: 20,
          length: 4,
          weight: 300,
          breadth: 20
        })
    ])

}

export const insertShopifyLocation = async (wareHouseName, locations, user_id) => {

    let shopify_location_query = `INSERT INTO shopify_locations (shopify_assigned_location, user_id, pickup_location) VALUES `
    const insertValue = []
    let startValue = 0;
    for (let index = 1; index <= locations?.length; index+= 1) {
        shopify_location_query += `($${index + startValue}, $${index + startValue + 1}, $${index + startValue + 2})`;
        if (index !== locations.length) {
            shopify_location_query += ', '
        }
        insertValue.push(locations[index-1].name, user_id, wareHouseName);
        startValue += 2
    }
    
    await query(shopify_location_query, insertValue);

}