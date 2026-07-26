if (process.env.GITHUB_ACTIONS !== "true") {
    require("dotenv").config();
}
const axios = require('axios');

// ตั้งวันเริ่มและระยะเวลารวม
const START_DATE = new Date("2026-08-10T00:00:00Z");
const TOTAL_YEARS = 4;
const END_DATE = new Date(START_DATE);
END_DATE.setFullYear(END_DATE.getFullYear() + TOTAL_YEARS);

const THAI_OFFSET_MS = 7 * 60 * 60 * 1000;

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_USER_ID = process.env.DISCORD_USER_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

function getProgress() {
    const now = Date.now();
    const start = START_DATE.getTime();
    const end = END_DATE.getTime();
    const raw = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, raw));
}

function getThaiNow() {
    return new Date(Date.now() + THAI_OFFSET_MS);
}

function getYearSemesterLabel() {
    const now = getThaiNow();
    const startThai = new Date(START_DATE.getTime() + THAI_OFFSET_MS);
    let months = (now.getUTCFullYear() - startThai.getUTCFullYear()) * 12 +
                 (now.getUTCMonth() - startThai.getUTCMonth());
    if (months < 0) months = 0;
    const year = Math.min(Math.floor(months / 12) + 1, TOTAL_YEARS);
    const half = Math.floor((months % 12) / 6);
    const semester = half === 0 ? "First Semester (Fall)" : "Second Semester (Spring)";
    return `Year ${year} - ${semester}`;
}

function getTodayLabel() {
    const now = getThaiNow();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = now.getUTCDate();
    const month = months[now.getUTCMonth()];
    const year = now.getUTCFullYear();
    return `${day} ${month} ${year}`;
}

async function syncProgress() {
    try {
        const percent = getProgress();
        const label = getYearSemesterLabel();
        const dynamic = [
            { type: 1, name: "progress_str", value: `University Progression - ${getTodayLabel()}` },
            { type: 2, name: "progress_bar", value: Math.round(percent * 100) / 10000 },
            { type: 1, name: "progress_txt", value: `${percent.toFixed(1)}%` },
            { type: 1, name: "progress_label", value: label }
        ];
        const payload = { data: { dynamic } };
        const discordApiUrl =
            `https://discord.com/api/v9/applications/${DISCORD_CLIENT_ID}` +
            `/users/${DISCORD_USER_ID}/identities/0/profile`;
        const response = await axios.patch(discordApiUrl, payload, {
            headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        console.log(`✅ Progress updated: ${percent.toFixed(2)}% (${label}). Status: ${response.status}`);
    } catch (error) {
        if (error.response) {
            console.error("Discord API Error:", error.response.status, error.response.data);
            process.exit(1);
        } else {
            console.error("Request Error:", error.message);
            process.exit(1);
        }
    }
}
syncProgress();
