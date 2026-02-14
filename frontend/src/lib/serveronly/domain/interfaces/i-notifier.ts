export interface INotifier {
  sendMessage(input: {
    source: string;
    message: string;
  }): Promise<{ error?: string }>;
}
