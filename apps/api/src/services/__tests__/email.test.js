const assert = require('node:assert/strict');
const { once } = require('node:events');
const net = require('node:net');
const { test } = require('node:test');
const nodemailer = require('nodemailer');

for (const mode of ['configured', 'ethereal']) {
  for (const greeting of ['no STARTTLS', 'STARTTLS rejected', 'EHLO rejected']) {
    test(`${mode} SMTP fails before credentials or mail when ${greeting}`, { timeout: 5000 }, async (t) => {
      const commands = [];
      const sockets = new Set();
      const server = net.createServer((socket) => {
        sockets.add(socket);
        socket.on('close', () => sockets.delete(socket));
        socket.setEncoding('utf8');
        socket.write('220 synthetic SMTP server\r\n');
        let buffer = '';
        socket.on('data', (chunk) => {
          buffer += chunk;
          let end;
          while ((end = buffer.indexOf('\r\n')) !== -1) {
            const line = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            const command = line.split(' ')[0];
            commands.push(command);
            if (command === 'EHLO') {
              socket.write(greeting === 'EHLO rejected' ? '502 EHLO unavailable\r\n'
                : `250-localhost\r\n${greeting === 'STARTTLS rejected' ? '250-STARTTLS\r\n' : ''}250 AUTH PLAIN\r\n`);
            } else if (command === 'STARTTLS') {
              socket.write('454 TLS unavailable\r\n');
            } else {
              // End any insecure attempt without collecting passwords or message data.
              socket.end('535 insecure operation rejected by test fixture\r\n');
            }
          }
        });
      });
      t.after(async () => {
        for (const socket of sockets) socket.destroy();
        await new Promise((resolve) => server.close(resolve));
      });
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');

      const keys = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
      const previous = keys.map((key) => process.env[key]);
      t.after(() => keys.forEach((key, i) => {
        if (previous[i] === undefined) delete process.env[key];
        else process.env[key] = previous[i];
      }));
      process.env.EMAIL_HOST = mode === 'configured' ? '127.0.0.1' : '';
      process.env.EMAIL_PORT = String(server.address().port);
      process.env.EMAIL_USER = 'synthetic-user';
      process.env.EMAIL_PASS = 'synthetic-password';
      t.mock.method(nodemailer, 'createTestAccount', async () => ({
        user: 'synthetic-user', pass: 'synthetic-password',
      }));
      const createTransport = nodemailer.createTransport;
      t.mock.method(nodemailer, 'createTransport', (options) => createTransport({
        ...options,
        // Redirect only the endpoint; exercise the service's real TLS/auth options.
        host: '127.0.0.1', port: server.address().port,
        connectionTimeout: 1000, greetingTimeout: 1000, socketTimeout: 1000,
      }));
      const servicePath = require.resolve('../email.service');
      delete require.cache[servicePath];
      t.after(() => { delete require.cache[servicePath]; });
      const email = require('../email.service');
      const result = await email.sendPasswordResetEmail({
        to: 'synthetic@example.test', name: 'Test', tempPassword: 'Synthetic-temp1!',
        loginUrl: 'https://example.test/login',
      });

      assert.equal(result.success, false);
      assert.deepEqual(commands, greeting === 'EHLO rejected' ? ['EHLO'] : ['EHLO', 'STARTTLS']);
      assert.match(result.error, /STARTTLS/);
    });
  }
}
