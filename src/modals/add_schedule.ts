import { ModalSubmitInteraction } from "discord.js";
import type { Modal } from "../types";
import { db } from "../db";

const modal: Modal = {
    customId: "addScheduleModal",
    
    execute: async (interaction: ModalSubmitInteraction) => {

        const day = interaction.fields.getTextInputValue('dayInput');
        const time = interaction.fields.getTextInputValue('timeInput');
        const reason = interaction.fields.getTextInputValue('descriptionInput');

        console.log(`New schedule entry added:
        Day: ${day}
        Time: ${time}
        Reason: ${reason}
        by User: ${interaction.user.id}`);
        
        // check day format (yyyy/mm/dd)
        if (!/^\d{4}\/\d{2}\/\d{2}$/.test(day)) {
            await interaction.reply({ content: "(Error) Invalid day format. Please use YYYY/MM/DD.", flags: 64 });
            return;
        }

        // check time format (hh:mm)
        if (!/^\d{2}:\d{2}$/.test(time)) {
            await interaction.reply({ content: "(Error) Invalid time format. Please use HH:MM in 24-hour format.", flags: 64 });
            return;
        }
        const [year, month, date] = day.split('/').map(Number) as [number, number, number];
        const [hour, minute] = time.split(':').map(Number) as [number, number];
        if (month < 1 || month > 12 || date < 1 || date > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            await interaction.reply({ content: "(Error) Invalid date or time values.", flags: 64 });
            return;
        }
        const schedule_timestamp = new Date(year, month - 1, date, hour, minute);
        if (isNaN(schedule_timestamp.getTime())) {
            await interaction.reply({ content: "(Error) Invalid date or time provided.", flags: 64 });
            return;
        }

        const [_, notificationChannelId, notificationRoleId] = interaction.customId.split(':');

        try {
            await db.query(
                'INSERT INTO scheduled_tasks (guild_id, notification_channel, notification_role, task_description, scheduled_time, added_by) VALUES ($1, $2, $3, $4, $5, $6)',
                [interaction.guildId || 'DM', notificationChannelId, notificationRoleId, reason, schedule_timestamp, interaction.user.id]
            );
        
            await interaction.reply({ content: "(OK) Schedule entry added successfully.", flags: 64 });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "(Error) Failed to add schedule entry.", flags: 64 });
        }
    }
};

export default modal;