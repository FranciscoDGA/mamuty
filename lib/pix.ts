import QRCode from 'qrcode';

export interface PixPayloadParams {
  pixKey: string;
  beneficiaryName: string;
  city: string;
  amount: number;
  txId?: string;
  description?: string;
}

// CRC16 CCITT calculation for standard EMV PIX payload
function calculateCrc16(payload: string): string {
  let polynomial = 0x1021;
  let result = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    result ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((result & 0x8000) !== 0) {
        result = (result << 1) ^ polynomial;
      } else {
        result = result << 1;
      }
      result &= 0xffff;
    }
  }

  return result.toString(16).toUpperCase().padStart(4, '0');
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePixCopiaECola(params: PixPayloadParams): string {
  const { pixKey, beneficiaryName, city, amount, txId = 'MAMUTY' } = params;

  // Merchant Account Information (Tag 26)
  const gui = emvField('00', 'BR.GOV.BCB.PIX');
  const key = emvField('01', pixKey);
  const merchantAccountInfo = emvField('26', `${gui}${key}`);

  // Merchant Category Code (Tag 52)
  const mcc = emvField('52', '0000');

  // Transaction Currency 986 = BRL (Tag 53)
  const currency = emvField('53', '986');

  // Transaction Amount (Tag 54)
  const formattedAmount = amount.toFixed(2);
  const amountField = emvField('54', formattedAmount);

  // Country Code (Tag 58)
  const country = emvField('58', 'BR');

  // Merchant Name (Tag 59) - max 25 chars
  const cleanName = beneficiaryName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25)
    .toUpperCase();
  const nameField = emvField('59', cleanName || 'MAMUTY BARBEARIA');

  // Merchant City (Tag 60) - max 15 chars
  const cleanCity = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 15)
    .toUpperCase();
  const cityField = emvField('60', cleanCity || 'SAO PAULO');

  // Additional Data Field (Tag 62) -> txId (Tag 05)
  const cleanTxId = txId.replace(/[^A-Za-z0-9]/g, '').substring(0, 25) || 'MAMUTY';
  const additionalDataField = emvField('62', emvField('05', cleanTxId));

  // Assemble Payload without CRC
  const payloadFormatIndicator = emvField('00', '01');
  const pointOfInitiationMethod = emvField('01', '12'); // 12 = dynamic/repeatable

  const payloadWithoutCrc =
    `${payloadFormatIndicator}` +
    `${pointOfInitiationMethod}` +
    `${merchantAccountInfo}` +
    `${mcc}` +
    `${currency}` +
    `${amountField}` +
    `${country}` +
    `${nameField}` +
    `${cityField}` +
    `${additionalDataField}` +
    `6304`;

  const crc = calculateCrc16(payloadWithoutCrc);
  return `${payloadWithoutCrc}${crc}`;
}

export async function generatePixQrCodeDataUrl(copiaECola: string): Promise<string> {
  try {
    return await QRCode.toDataURL(copiaECola, {
      margin: 1,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating PIX QR Code:', err);
    return '';
  }
}
