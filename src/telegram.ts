import { config } from "./config";

// Escapes text for Telegram parse_mode HTML (only &, <, > need escaping).
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Fire-and-forget Telegram notifier. No-op when creds are absent.
export async function notify(text: string): Promise<void> {
  const { token, chatId } = config.telegram;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch (err) {
    console.error("[telegram] send failed:", err instanceof Error ? err.message : err);
  }
}
