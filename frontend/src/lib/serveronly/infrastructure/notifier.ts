import 'server-only';
import { INotifier } from '@/lib/serveronly/domain/interfaces';
import { IClock } from '@/lib/serveronly/domain/interfaces';

type DiscordEmbed = {
  title: string;
  color: number;
  fields: { name: string; value: string; inline: boolean }[];
  timestamp: string;
};

const DISCORD_MESSAGE_LIMIT = 2000;
const SERVICE_DOWN_MESSAGE = 'It seems the service is currently unavailable.';

export class Notifier implements INotifier {
  constructor(
    private readonly webhookUrl: string | undefined,
    private readonly clock: IClock
  ) {}

  async sendMessage(input: {
    source: string;
    message: string;
  }): Promise<{ error?: string }> {
    if (!this.webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL is not configured');
      return { error: SERVICE_DOWN_MESSAGE };
    }

    try {
      const embed = this.createEmbed(input.source);

      if (input.message.length > DISCORD_MESSAGE_LIMIT) {
        await this.sendMessageAsFile(embed, input.message);
        return {};
      }

      const discordResponse = await this.sendMessageAsEmbed(
        embed,
        input.message
      );
      if (!discordResponse.ok) {
        console.error('Discord webhook failed:', await discordResponse.text());
        return { error: SERVICE_DOWN_MESSAGE };
      }

      return {};
    } catch (error) {
      console.error('Error sending message to Discord:', error);
      return { error: SERVICE_DOWN_MESSAGE };
    }
  }

  private async sendMessageAsEmbed(embed: DiscordEmbed, message: string) {
    return fetch(this.webhookUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message,
        embeds: [embed],
      }),
    });
  }

  private async sendMessageAsFile(embed: DiscordEmbed, message: string) {
    const formData = new FormData();
    formData.append(
      'payload_json',
      JSON.stringify({
        content: 'Message attached as file (exceeded character limit)',
        embeds: [embed],
      })
    );

    const messageBlob = new Blob([message], { type: 'text/plain' });
    formData.append('files[0]', messageBlob, 'message.txt');

    return fetch(this.webhookUrl!, {
      method: 'POST',
      body: formData,
    });
  }

  private createEmbed(source: string): DiscordEmbed {
    return {
      title: 'FGS Notification',
      color: 0x5865f2,
      fields: [{ name: 'Source', value: source.slice(0, 1024), inline: true }],
      timestamp: this.clock.now().toISOString(),
    };
  }
}

