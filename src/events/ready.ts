import { REST, Routes, ActivityType } from "discord.js";
import type { ExtendedClient } from "../types";
import { db } from "../db";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { initScheduler } from "../reschedule";

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

    initScheduler(client);
};

