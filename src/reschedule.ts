import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { db } from './db';

interface ScheduledTask {
    task_id: number | string;
    scheduled_time: Date | string;
    description: string;
    guild_id: string;
    channel: string;
    user_id: string;
    role: string;
}

let currentTimeout: NodeJS.Timeout | null = null;
let botClient: Client | null = null;

export const initScheduler = async (client: Client) => {
    botClient = client;
    console.log('[Scheduler] 排程系統已啟動');
    await reschedule();
};

export const reschedule = async () => {
    // 先清除現有的 timeout
    if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
    }

    try {
        const query = `
            SELECT * FROM scheduled_tasks 
            ORDER BY scheduled_time ASC 
            LIMIT 1
        `;
        const result = await db.query(query);

        if (result.rowCount === 0) {
            console.log('[Scheduler] 目前沒有待辦事項，進入休眠...');
            return;
        }

        const task: ScheduledTask = result.rows[0];

        const targetTime = new Date(task.scheduled_time).getTime();
        const now = Date.now();
        let delay = targetTime - now;

        const MAX_DELAY = 2147483647;
        if (delay > MAX_DELAY) {
            console.log(`[Scheduler] 下一筆任務在很久以後，先設定 ${MAX_DELAY}ms 後再次檢查`);
            currentTimeout = setTimeout(() => reschedule(), MAX_DELAY);
            return;
        }

        // 如果時間已經過了 (機器人關機過久)，設為 0 立刻執行
        if (delay < 0) {
            console.log(`[Scheduler] 發現過期任務 (ID: ${task.task_id})，準備立即補發`);
            delay = 0;
        } else {
            console.log(`[Scheduler] 下一筆任務 (ID: ${task.task_id}) 將在 ${Math.round(delay / 1000)} 秒後執行`);
        }

        // 設定鬧鐘
        currentTimeout = setTimeout(() => {
            executeTask(task);
        }, delay);

    } catch (error) {
        console.error('[Scheduler] 排程查詢錯誤:', error);
    }
};

// 執行任務：發送訊息並更新 DB
const executeTask = async (task: ScheduledTask) => {
    if (!botClient || !db) return;

    try {
        const guild = botClient.guilds.cache.get(task.guild_id);
        if (!guild) {
            console.warn(`[Scheduler] 找不到伺服器 ${task.guild_id}，標記任務為已處理以免卡死`);
            await markAsSent(task.task_id);
            return reschedule(); // 繼續下一筆
        }

        const channel = guild.channels.cache.get(task.channel) as TextChannel;
        if (!channel) {
            console.warn(`[Scheduler] 找不到頻道 ${task.channel}，標記任務為已處理`);
            await markAsSent(task.task_id);
            return reschedule();
        }

        let mentionString = '';
        if (task.user_id) {
            mentionString += `<@${task.user_id}> `;
        }
        if (task.role) {
            mentionString += `<@&${task.role}> `;
        }

        const embed = new EmbedBuilder()
            .setTitle('提醒事項')
            .setDescription(task.description)
            .setColor(0x00AE86)
            .setTimestamp();

        await channel.send({
            content: `${mentionString}`,
            embeds: [embed],
        });
        console.log(`[Scheduler] 已發送提醒給任務 ID: ${task.task_id}`);

        // 更新資料庫
        await markAsSent(task.task_id);

    } catch (error) {
        console.error(`[Scheduler] 執行任務 ID ${task.task_id} 失敗:`, error);
    } finally {
        reschedule();
    }
};

const markAsSent = async (taskId: number | string) => {
    try {
        // delete the task from the database
        const deleteQuery = `
            DELETE FROM scheduled_tasks 
            WHERE task_id = $1
        `;
        await db.query(deleteQuery, [taskId]);
    } catch (e) {
        console.error('[Scheduler] 更新 DB 狀態失敗:', e);
    }
};