import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, ChannelType, StringSelectMenuBuilder, ActionRow, ActionRowBuilder, ComponentType } from "discord.js";
import type { SlashCommand } from "../types";
import { db } from "../db";

function checkAuthority(userId: string, guildId: string | null): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        try {
            const ownerId = process.env.OWNER_ID;
            if (userId === ownerId) {
                resolve(true);
                return;
            }
            
            const adminCheck = await db.query(
                'SELECT 1 FROM admin_list WHERE user_id = $1',
                [userId]
            );
            if (adminCheck.rowCount && adminCheck.rowCount > 0) {
                resolve(true);
                return;
            }
            resolve(false);
        }
        catch (error) {
            reject(error);
        }
    });
}

const add_admin: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("add_admin")
        .setDescription("Adds a user as an admin.")
        .addUserOption(option =>
            option.setName("target")
                .setDescription("The user to be added as admin")
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        try {
            const targetUser = interaction.options.getUser("target", true);
            const executorId = interaction.user.id;

            let hasPermission = await checkAuthority(executorId, interaction.guildId);
            if (!hasPermission) {
                await interaction.reply({ 
                    content: "(Error) You do not have permission to use this command.", 
                    flags: MessageFlags.Ephemeral 
                });
                return;
            }

            const check = await db.query(
                'SELECT 1 FROM admin_list WHERE user_id = $1',
                [targetUser.id]
            );


            if (check.rowCount && check.rowCount > 0) {
                await interaction.reply({ 
                    content: `(Error) User ${targetUser.toString()} is already an admin.`, 
                    flags: MessageFlags.Ephemeral 
                });
                return;
            }

            await db.query(
                'INSERT INTO admin_list (user_id, user_name, added_by, admin_at_guild) VALUES ($1, $2, $3, $4)',
                [targetUser.id, targetUser.username, executorId, interaction.guildId || 'DM']
            );
            console.log(`(OK) User ${targetUser.id} added as admin by ${executorId}`);
            const embed = new EmbedBuilder()
                .setTitle("Admin Added")
                .setDescription(`User ${targetUser.toString()} has been added as an admin.`)
                .setColor(0x00FF00)
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '(Error) An error occurred while executing this command.', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: '(Error) An error occurred while executing this command.', flags: MessageFlags.Ephemeral });
            }
        }
    }
};

const add_schedule: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("add_schedule")
        .setDescription("Adds a schedule entry.")
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The channel to send notifications to")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName("role")
                .setDescription("The role to notify (can be empty for no role)")
        )
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to notify (can be empty for no user)")
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const executorId = interaction.user.id;
        let hasPermission = await checkAuthority(executorId, interaction.guildId);
        if (!hasPermission) {
            await interaction.reply({ 
                content: "(Error) You do not have permission to use this command.", 
                flags: MessageFlags.Ephemeral 
            });
            return;
        }
        
        const Channel = interaction.options.getChannel("channel", true);
        const Role = interaction.options.getRole("role", false);
        const User = interaction.options.getUser("user", false);

        const modal = new ModalBuilder()
            .setCustomId(`addScheduleModal:${Channel.id}:${Role?.id || ''}:${User?.id || ''}`)
            .setTitle('Add Schedule Entry');

        const dayInput = new TextInputBuilder()
            .setCustomId('dayInput')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(14)
            .setRequired(true);
        const dayLabel = new LabelBuilder()
            .setTextInputComponent(dayInput)
            .setLabel('Day (e.g., 2025/12/25)');

        const timeInput = new TextInputBuilder()
            .setCustomId('timeInput')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(8)
            .setRequired(true);

        const timeLabel = new LabelBuilder()
            .setTextInputComponent(timeInput)
            .setLabel('Time (HH:MM)');

        const descriptionInput = new TextInputBuilder()
            .setCustomId('descriptionInput')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1000)
            .setRequired(true);

        const descriptionLabel = new LabelBuilder()
            .setTextInputComponent(descriptionInput)
            .setLabel('Description');

        modal
            .addLabelComponents(dayLabel, timeLabel, descriptionLabel);
        
        await interaction.showModal(modal);
    }
};

const delete_admin: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("delete_admin")
        .setDescription("Deletes a user from admin list.")
        .addUserOption(option =>
            option.setName("target")
                .setDescription("The user to be removed from admin")
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const targetUser = interaction.options.getUser("target", true);
        const executorId = interaction.user.id;

        let hasPermission = await checkAuthority(executorId, interaction.guildId);
        if (!hasPermission) {
            await interaction.reply({ 
                content: "(Error) You do not have permission to use this command.", 
                flags: MessageFlags.Ephemeral 
            });
            return;
        }

        const check = await db.query(
            'SELECT 1 FROM admin_list WHERE user_id = $1',
            [targetUser.id]
        );

        if (!check.rowCount || check.rowCount === 0) {
            await interaction.reply({ 
                content: `(Error) User ${targetUser.toString()} is not an admin.`, 
                flags: MessageFlags.Ephemeral 
            });
            return;
        }

        await db.query(
            'DELETE FROM admin_list WHERE user_id = $1',
            [targetUser.id]
        );
        console.log(`(OK) User ${targetUser.id} removed from admin by ${executorId}`);
        const embed = new EmbedBuilder()
            .setTitle("Admin Removed")
            .setDescription(`User ${targetUser.toString()} has been removed from admin.`)
            .setColor(0xFF0000)
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
};

const delete_schedule: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("delete_schedule")
        .setDescription("Deletes a schedule entry."),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const executorId = interaction.user.id;
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let hasPermission = await checkAuthority(executorId, interaction.guildId);
        if (!hasPermission) {
            await interaction.editReply({ 
                content: "(Error) You do not have permission to use this command.", 
            });
            return;
        }

        const scheduleEntries = await db.query(
            'SELECT task_id, scheduled_time, description FROM scheduled_tasks WHERE guild_id = $1 ORDER BY scheduled_time ASC',
            [interaction.guildId]
        );
        if (!scheduleEntries.rowCount || scheduleEntries.rowCount === 0) {
            await interaction.editReply({ 
                content: "(Error) There are no schedule entries to delete.", 
            });
            return;
        }
        const embed = new EmbedBuilder()
            .setTitle("Delete Schedule Entry")
            .setDescription("Please choose the schedule entry to delete from the list below.")
            .setColor(0xFFFF00)
            .setTimestamp();

        const entriesList = new StringSelectMenuBuilder()
            .setCustomId('deleteScheduleSelect')
            .setPlaceholder('Select a schedule entry to delete');

        const limit_rows = scheduleEntries.rows.slice(0, 25); // Limit to first 25 entries

        limit_rows.forEach(row => {
            const scheduleTime = new Date(row.scheduled_time).toLocaleString();
            entriesList.addOptions({
                label: `${scheduleTime}`,
                description: row.description.length > 50 ? row.description.substring(0, 47) + '...' : row.description,
                value: row.task_id.toString()
            });
        });

        if (scheduleEntries.rowCount > 25) {
            embed.setFooter({ text: `Showing top 25 of ${scheduleEntries.rowCount} entries.` });
        }

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(entriesList);

        const response = await interaction.editReply({ 
            embeds: [embed], 
            components: [row] 
        });


        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60000 // 60秒內有效
        });

        collector.on('collect', async i => {
            const selectedTaskId = i.values[0];
            // 執行資料庫刪除動作
            try {
                await db.query('DELETE FROM scheduled_tasks WHERE task_id = $1', [selectedTaskId]);
                
                await i.update({ 
                    content: `✅ Successfully deleted schedule entry (ID: ${selectedTaskId}).`, 
                    embeds: [], 
                    components: [] 
                });
            } catch (error) {
                console.error(error);
                await i.update({ 
                    content: `❌ Failed to delete the entry due to a database error.`,
                    embeds: [], 
                    components: []
                });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                // 超時未選擇，移除選單
                interaction.editReply({
                    content: 'Time expired. Please run the command again if you wish to delete an entry.',
                    components: []
                }).catch(() => {}); // 忽略可能的錯誤 (例如訊息已被刪除)
            }
        });
    }
};
export default [add_admin, add_schedule, delete_admin, delete_schedule];