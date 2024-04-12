

import * as pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg.default;

// # Environment variables
dotenv.config();


if (!process.env.PGHOST || !process.env.PGUSER || !process.env.PGDATABASE) {

	throw new Error(
		'Please define the Postgres environment variables .env.local'
	);

}

if (!global.db) {

	global.db = { pool: null };

}


const query = (text, params) => {

	if (!global.db.pool) {

		global.db.pool = new Pool({
			user: process.env.PGUSER,
			host: process.env.PGHOST,
			database: process.env.PGDATABASE,
			password: process.env.PGPASSWORD,
			port: process.env.PGPORT,
			max: 10
		});
	
		global.db.pool.on('error', (err) => {

            console.log('error occur in query', err)
			throw err;
	
		});
	
	}

	return global.db.pool.query(text, params);

};

export default query;




