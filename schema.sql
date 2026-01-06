CREATE TABLE IF NOT EXISTS active_guilds (
    guild_id VARCHAR(20) PRIMARY KEY,
    guild_name VARCHAR(100),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_list (
    user_id VARCHAR(20) PRIMARY KEY,
    user_name VARCHAR(100),
    admin_at_guild VARCHAR(20),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    added_by VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS scheduled_tasks (
    task_id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20),
    notification_channel VARCHAR(20),
    notification_role VARCHAR(20),
    task_description TEXT,
    scheduled_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    added_by VARCHAR(20)
);