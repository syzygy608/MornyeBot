import { REST, Routes } from "discord.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error("(ERROR) 缺少環境變數 DISCORD_TOKEN 或 CLIENT_ID");
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

async function clearCommands() {
    try {
        console.log("(OK) 開始清除指令...");

        console.log("正在清除全域指令...");
        await rest.put(
            Routes.applicationCommands(clientId!),
            { body: [] }
        );
        console.log("全域指令已清除");

        const guildId = process.env.TEST_GUILD_ID;

        if (guildId) {
            console.log(`正在清除伺服器 (${guildId}) 指令...`);
            await rest.put(
                Routes.applicationGuildCommands(clientId!, guildId),
                { body: [] }
            );
            console.log(`(ERROR) 伺服器 (${guildId}) 指令已清除`);
        } else {
            console.log("(EXIT) 未設定 TEST_GUILD_ID，跳過清除伺服器指令");
        }

        console.log("(OK) 全部完成！");

    } catch (error) {
        console.error("(ERROR) 清除失敗:", error);
    }
}


clearCommands();