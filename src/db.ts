import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
    
    getRegisteredGuilds: async (): Promise<string[]> => {
        try {
            const res = await pool.query('SELECT guild_id FROM active_guilds');
            return res.rows.map(row => row.guild_id);
        } catch (error) {
            console.error('Database Error:', error);
            return [];
        }
    }
};