import 'server-only';

const DISCORD_MESSAGE_LIMIT = 2000;

type DiscordEmbed = {
  title: string;
  color: number;
  fields: { name: string; value: string; inline: boolean }[];
  timestamp: string;
};
const SERVICE_DOWN_MESSAGE = 'It seems the service is currently unavailable.';

export async function sendDiscordMessage({
  source,
  message,
}: {
  source: string;
  message: string;
}): Promise<{ error?: string }> {
  const checkWebhookUrlResult = checkWebhookUrl();
  if (!checkWebhookUrlResult.webhookUrl) {
    return { error: SERVICE_DOWN_MESSAGE };
  }
  const webhookUrl = checkWebhookUrlResult.webhookUrl!;

  try {
    const embed = createEmbed({ source });

    const messageExceedsLimit = message.length > DISCORD_MESSAGE_LIMIT;

    let discordResponse: Response;

    if (messageExceedsLimit) {
      discordResponse = await sendMessageAsFile({
        embed,
        message,
        webhookUrl,
      });
    } else {
      discordResponse = await sendMessageAsEmbed({
        embed,
        message,
        webhookUrl,
      });

      if (!discordResponse.ok) {
        console.error('Discord webhook failed:', await discordResponse.text());
        return { error: SERVICE_DOWN_MESSAGE };
      }
    }
  } catch (error) {
    console.error('Error sending message to Discord:', error);
    return { error: SERVICE_DOWN_MESSAGE };
  }

  return {};
}

function checkWebhookUrl(): {
  webhookUrl?: string;
} {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not configured');
    return {};
  }
  return { webhookUrl };
}

async function sendMessageAsEmbed({
  embed,
  message,
  webhookUrl,
}: {
  embed: DiscordEmbed;
  message: string;
  webhookUrl: string;
}) {
  const discordPayload = {
    content: message,
    embeds: [embed],
  };

  return await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discordPayload),
  });
}

async function sendMessageAsFile({
  embed,
  message,
  webhookUrl,
}: {
  embed: DiscordEmbed;
  message: string;
  webhookUrl: string;
}) {
  const formData = new FormData();

  const payload = {
    content: 'Message attached as file (exceeded character limit)',
    embeds: [embed],
  };

  formData.append('payload_json', JSON.stringify(payload));

  const messageBlob = new Blob([message], { type: 'text/plain' });
  formData.append('files[0]', messageBlob, 'message.txt');

  return await fetch(webhookUrl, {
    method: 'POST',
    body: formData,
  });
}

function createEmbed({ source }: { source: string }) {
  return {
    title: 'FGS Notification',
    color: 0x5865f2,
    fields: [{ name: 'Source', value: source.slice(0, 1024), inline: true }],
    timestamp: new Date().toISOString(),
  };
}
