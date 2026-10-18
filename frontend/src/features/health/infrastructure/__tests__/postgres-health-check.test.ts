import { afterEach, describe, expect, it } from 'bun:test';
import { createServer, type Server, type Socket } from 'node:net';
import { PostgresHealthCheck } from '../postgres-health-check';

describe('Postgres health-check timeouts', () => {
  let server: Server;
  let disconnected: Promise<void>;
  const sockets = new Set<Socket>();

  afterEach(async () => {
    for (const socket of sockets) socket.destroy();
    sockets.clear();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  async function listen(onConnection: (socket: Socket) => void) {
    let onDisconnected: () => void;
    disconnected = new Promise<void>((resolve) => {
      onDisconnected = resolve;
    });
    server = createServer((socket) => {
      sockets.add(socket);
      socket.on('close', () => {
        sockets.delete(socket);
        onDisconnected();
      });
      onConnection(socket);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as { port: number };
    return new PostgresHealthCheck(
      `postgresql://test:test@127.0.0.1:${address.port}/test?sslmode=disable`
    );
  }

  it('times out and closes a connection that never finishes the handshake', async () => {
    const check = await listen(() => {});
    const started = performance.now();
    await expect(check.check()).rejects.toThrow();
    await disconnected;
    expect(performance.now() - started).toBeLessThan(3500);
  });

  it('times out and closes a connection when SELECT 1 never gets a response', async () => {
    let query = '';
    const check = await listen((socket) => {
      socket.once('data', () => {
        // Minimal PostgreSQL handshake: AuthenticationOk, then ReadyForQuery.
        socket.write(Buffer.from('5200000008000000005a0000000549', 'hex'));
        socket.once('data', (data) => {
          query = data.subarray(5, -1).toString();
        });
      });
    });
    const started = performance.now();
    await expect(check.check()).rejects.toThrow('Query read timeout');
    await disconnected;
    expect(query).toBe('SELECT 1');
    expect(performance.now() - started).toBeLessThan(3500);
  });
});
