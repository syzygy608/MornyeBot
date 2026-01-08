import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { SlashCommand } from "../types";

const ping: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Pong! Returns the bot's latency."),
    
    execute: async (interaction) => {
        await interaction.reply("Pong!");

        const embed = await new EmbedBuilder()
            .setTitle("Bot Latency")
            .setDescription(
                `API 延遲: ${interaction.client.ws.ping} ms` 
            )
            .setColor(0x00AE86)
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed], content: "" });
    }
};

const info: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Provides information about the bot."),
            
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setTitle("MornyeBot Information")
            .setDescription("I am MornyeBot, your friendly Discord bot!")
            .setColor(0x00AE86)
            .addFields(
                { name: "Creator", value: "d1stance" },
                { name: "Version", value: "1.0.0" },
                { name: "Usage", value: "This bot only supports slash commands." }
            )
            .setThumbnail(interaction.client.user?.avatarURL() || "")
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    }
};

export default [ping, info];