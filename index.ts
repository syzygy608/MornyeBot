import { Client, Collection, GatewayIntentBits } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import type { ExtendedClient, SlashCommand, Modal } from "./src/types";


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
}) as ExtendedClient;

client.commands = new Collection();
client.modals = new Collection();

const init = async () => {
    const slashPath = path.join(import.meta.dir, "src", "slash");
    if (fs.existsSync(slashPath)) {
        const commandFiles = fs.readdirSync(slashPath).filter(file => file.endsWith(".ts"));

        for (const file of commandFiles) {
            const filePath = path.join(slashPath, file);
            const module = await import(filePath);
            
            const imported = module.default;
            
            const commands: SlashCommand[] = Array.isArray(imported) ? imported : [imported];

            for (const command of commands) {
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    console.log(`[Command] 載入指令: ${command.data.name}`);
                } else {
                    console.log(`[Warning] 檔案 ${file} 中的指令格式錯誤`);
                }
            }
        }
    }

    const modalsPath = path.join(import.meta.dir, "src", "modals");
    if (fs.existsSync(modalsPath)) {
        const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith(".ts"));

        for (const file of modalFiles) {
            const filePath = path.join(modalsPath, file);
            const module = await import(filePath);
            const modal: Modal = module.default;

            if ('customId' in modal && 'execute' in modal) {
                client.modals.set(modal.customId, modal);
                console.log(`[Modal] 載入 Modal: ${modal.customId}`);
            }
        }
    }

    const ready = (await import("./src/events/ready.ts")).default;
    const interactionCreate = (await import("./src/events/interaction.ts")).default;

    client.once("clientReady", () => ready(client));
    client.on("interactionCreate", (interaction) => interactionCreate(client, interaction));

    client.login(process.env.DISCORD_TOKEN);
};

init();