import speakeasy from 'otplib';
import QRCode from 'qrcode';
import { logger } from '../../core/utils/logger.js';

/**
 * Red-Zone File: MFA (TOTP) Service
 */
export class MfaService {
  static generateSecret(email) {
    const secret = speakeasy.authenticator.generateSecret();
    const otpauthUrl = speakeasy.authenticator.keyuri(email, 'TBI Platform', secret);
    return { secret, otpauthUrl };
  }

  static async generateQrCodeDataUrl(otpauthUrl) {
    return QRCode.toDataURL(otpauthUrl);
  }

  static verifyToken(token, secret) {
    return speakeasy.authenticator.verify({ token, secret });
  }
}
