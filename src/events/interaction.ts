import { Interaction, MessageFlags } from "discord.js";
import type { ExtendedClient } from "../types";

export default async (client: ExtendedClient, interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "(Error) 指令執行錯誤", flags: MessageFlags.Ephemeral });
        }
        return;
    }

    if (interaction.isModalSubmit()) {
        const [modalKey] = interaction.customId.split(":");

        const modal = client.modals.get(modalKey as string);

        if (!modal) {
            console.warn(`(Failed) 收到未知的 Modal ID: ${interaction.customId} (Key: ${modalKey})`);
            return;
        }

        try {
            await modal.execute(interaction);
        } catch (error) {
            console.error(`Modal ${interaction.customId} 執行錯誤:`, error);
            if (!interaction.replied && !interaction.deferred) {
                 await interaction.reply({ 
                    content: "(Error) 處理表單時發生錯誤", 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
        return;
    }
};