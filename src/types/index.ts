import { Client, Collection, ChatInputCommandInteraction, SlashCommandBuilder, ModalSubmitInteraction } from "discord.js";

export interface SlashCommand {
    data: SlashCommandBuilder | any;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface Modal {
    customId: string;
    execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}

export interface ExtendedClient extends Client {
    commands: Collection<string, SlashCommand>;
    modals: Collection<string, Modal>;
}