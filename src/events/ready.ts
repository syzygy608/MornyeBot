import { REST, Routes, ActivityType, TextChannel, EmbedBuilder } from "discord.js";
import type { ExtendedClient } from "../types";
import { db } from "../db";
import cron from 'node-cron';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async (client: ExtendedClient) => {
    console.log(`Logged in as ${client.user?.tag}`);
    client.user?.setActivity({
        name: "Mornye Bot | /info",
        type: ActivityType.Playing,
    });

    const commandsData = client.commands.map(cmd => cmd.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

    try {
        const targetGuilds = await db.getRegisteredGuilds();

        if (targetGuilds.length > 0) {
            console.log(`正在將指令註冊到 ${targetGuilds.length} 個伺服器...`);
            for (const guildId of targetGuilds) {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
                    { body: commandsData }
                );
            }
        } else {
            console.log("Global 註冊中...");
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID!),
                { body: commandsData }
            );
        }
        console.log('(OK) Slash Commands 註冊完畢');
    } catch (error) {
        console.error('(ERROR) 註冊指令失敗:', error);
    }

    // 啟動排程任務
    cron.schedule('* * * * *', async () => {
        const now = dayjs().tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss');
        const tasks = await db.query(
            'SELECT guild_id, channel, role, user_id, description FROM scheduled_tasks WHERE scheduled_time <= $1',
            [now]
        );

        for (const task of tasks.rows) {
            const guild = await client.guilds.fetch(task.guild_id).catch(() => null);
            if (!guild) continue;

            const channel = await guild.channels.fetch(task.channel).catch(() => null);
            if (!channel || channel.type !== 0) continue; // 0 是 TextChannel

            const roleMention = task.role ? `<@&${task.role}> ` : '';
            const userMention = task.user_id ? `<@${task.user_id}> ` : '';

            const embed = new EmbedBuilder()
                .setTitle('Scheduled Task Reminder')
                .setDescription(task.description)
                .setColor(0x00AE86)
                .setTimestamp();

            await (channel as TextChannel).send({
                content: `${roleMention}${userMention}`,
                embeds: [embed],
            });

            // 刪除已執行的任務
            await db.query(
                'DELETE FROM scheduled_tasks WHERE guild_id = $1 AND channel = $2 AND description = $3',
                [task.guild_id, task.channel, task.description]
            );

            console.log(`已在伺服器 ${task.guild_id} 的頻道 ${task.channel} 發送排程任務通知。`);
        }
    });
};

