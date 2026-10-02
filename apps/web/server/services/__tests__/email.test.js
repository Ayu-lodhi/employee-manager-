const assert = require('node:assert/strict');
const { test } = require('node:test');
const nodemailer = require('nodemailer');

test('credential emails render profile names as HTML text', async (t) => {
  // Use Nodemailer's local JSON transport: no SMTP or Ethereal requests.
  const transport = nodemailer.createTransport({ jsonTransport: true });
  let message;
  t.mock.method(nodemailer, 'createTestAccount', async () => ({ user: 'test', pass: 'test' }));
  t.mock.method(nodemailer, 'createTransport', () => ({
    async sendMail(options) {
      const info = await transport.sendMail(options);
      message = JSON.parse(info.message);
      return info;
    },
  }));
  t.mock.method(console, 'log', () => {});
  const email = require('../email.service');
  const cases = [
    {
      label: 'injected link',
      name: '</strong><a href="https://attacker.example">Send password here</a><strong>',
      escaped: '&lt;/strong&gt;&lt;a href=&quot;https://attacker.example&quot;&gt;Send password here&lt;/a&gt;&lt;strong&gt;',
    },
    { label: 'special characters', name: 'Zoë & O\'Neil "<李>"',
      escaped: 'Zoë &amp; O&#39;Neil &quot;&lt;李&gt;&quot;' },
    { label: 'literal entities', name: '&lt;Admin&gt; &#60; &amp;',
      escaped: '&amp;lt;Admin&amp;gt; &amp;#60; &amp;amp;' },
    { label: 'ordinary name', name: 'Asha Kumar', escaped: 'Asha Kumar' },
  ];

  for (const template of ['sendPasswordResetEmail', 'sendWelcomeEmail']) {
    for (const { label, name, escaped } of cases) {
      await t.test(`${template}: ${label}`, async () => {
        const result = await email[template]({
          to: 'recipient@example.test', name, role: 'T1_VOLUNTEER',
          tempPassword: 'TBI@Synthetic42', loginUrl: 'https://platform.example/login',
        });
        assert.equal(result.success, true);
        assert.ok(message.html.includes(`Hi <strong>${escaped}</strong>,`));
        assert.equal((message.html.match(/<a\b/g) || []).length, 1);
        assert.ok(message.html.includes('href="https://platform.example/login"'));
        assert.ok(message.html.includes('TBI@Synthetic42'));
        assert.ok(message.text.includes(name));
        assert.ok(message.text.includes('TBI@Synthetic42'));
        assert.equal(message.to[0].address, 'recipient@example.test');
      });
    }
  }
});
