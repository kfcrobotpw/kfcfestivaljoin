import { Booth } from '../types';

/**
 * Generates high-resolution stand poster image (PNG) using HTML5 Canvas
 */
export async function downloadStandPosterPNG(booth: Booth, qrDataUrl: string): Promise<void> {
  const canvas = document.createElement('canvas');
  const width = 1240;
  const height = 1754; // A4 ratio (1 : 1.414)
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Decorative Frame
  const margin = 36;
  const frameW = width - margin * 2;
  const frameH = height - margin * 2;
  const radius = 32;

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 10;
  drawRoundedRect(ctx, margin, margin, frameW, frameH, radius);
  ctx.stroke();

  // Corner Accents (Cyan #0891B2)
  ctx.strokeStyle = '#0891B2';
  ctx.lineWidth = 8;
  const cornerSize = 40;

  // Top Left
  ctx.beginPath();
  ctx.moveTo(margin + 16, margin + 16 + cornerSize);
  ctx.lineTo(margin + 16, margin + 16);
  ctx.lineTo(margin + 16 + cornerSize, margin + 16);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(width - margin - 16 - cornerSize, margin + 16);
  ctx.lineTo(width - margin - 16, margin + 16);
  ctx.lineTo(width - margin - 16, margin + 16 + cornerSize);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(margin + 16, height - margin - 16 - cornerSize);
  ctx.lineTo(margin + 16, height - margin - 16);
  ctx.lineTo(margin + 16 + cornerSize, height - margin - 16);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(width - margin - 16 - cornerSize, height - margin - 16);
  ctx.lineTo(width - margin - 16, height - margin - 16);
  ctx.lineTo(width - margin - 16, height - margin - 16 - cornerSize);
  ctx.stroke();

  // 3. Header Section
  let currentY = margin + 50;

  // Header Pill
  const pillText = 'K.F.C. FESTIVAL';
  ctx.font = 'bold 22px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  const pillMetrics = ctx.measureText(pillText);
  const pillW = pillMetrics.width + 36;
  const pillH = 38;
  const pillX = (width - pillW) / 2;

  ctx.fillStyle = '#0891B2';
  drawRoundedRect(ctx, pillX, currentY, pillW, pillH, 19);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, width / 2, currentY + pillH / 2);

  currentY += pillH + 20;

  // Subtitle
  ctx.font = 'bold 22px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('용인시청소년수련관 로봇동아리', width / 2, currentY);
  currentY += 45;

  // Festival Title
  ctx.font = '900 44px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText('2026 K.F.C. 로봇 체험 페스티벌', width / 2, currentY);
  currentY += 42;

  // Catchphrase
  ctx.font = 'bold 26px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#0E7490';
  ctx.fillText('🤖 로봇 미션 체험하고 스탬프를 모아보세요! 🎁', width / 2, currentY);
  currentY += 35;

  // Header Divider
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(margin + 40, currentY);
  ctx.lineTo(width - margin - 40, currentY);
  ctx.stroke();
  currentY += 40;

  // 4. Booth Main Info
  // Booth Number Badge
  const boothOrderStr = `BOOTH ${String(booth.order || 1).padStart(2, '0')}`;
  ctx.font = '900 24px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  const orderMetrics = ctx.measureText(boothOrderStr);
  const orderW = orderMetrics.width + 32;
  const orderH = 40;
  const orderX = (width - orderW) / 2;

  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, orderX, currentY, orderW, orderH, 12);
  ctx.fill();

  ctx.fillStyle = '#67E8F9';
  ctx.fillText(boothOrderStr, width / 2, currentY + orderH / 2);
  currentY += orderH + 30;

  // Booth Name
  ctx.font = '900 52px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText(booth.name, width / 2, currentY);
  currentY += 45;

  // Booth Description (Wrap text)
  ctx.font = '500 24px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#334155';
  const maxDescW = width - 240;
  const lines = wrapText(ctx, booth.description || '', maxDescW);
  lines.forEach((line) => {
    ctx.fillText(line, width / 2, currentY);
    currentY += 32;
  });

  // Location if available
  if (booth.location) {
    currentY += 10;
    const locText = `📍 부스 위치: ${booth.location}`;
    ctx.font = 'bold 20px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#0E7490';
    ctx.fillText(locText, width / 2, currentY);
    currentY += 25;
  } else {
    currentY += 10;
  }

  // 5. Huge QR Code Container & Image
  const qrBoxSize = 440;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = currentY + 15;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
  ctx.fill();
  ctx.stroke();

  // Load and draw QR code image
  if (qrDataUrl) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const pad = 24;
        ctx.drawImage(img, qrBoxX + pad, qrBoxY + pad, qrBoxSize - pad * 2, qrBoxSize - pad * 2);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = qrDataUrl;
    });
  }

  currentY = qrBoxY + qrBoxSize + 30;

  // Scan Guidance text
  ctx.font = '900 24px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#0891B2';
  ctx.fillText('📱 스마트폰 카메라로 QR 코드를 비춰주세요', width / 2, currentY);
  currentY += 40;

  // 6. Token Code Box
  const tokenBoxW = width - 240;
  const tokenBoxH = 65;
  const tokenBoxX = (width - tokenBoxW) / 2;

  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, tokenBoxX, currentY, tokenBoxW, tokenBoxH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 20px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.textAlign = 'left';
  ctx.fillText('인증 코드 (수동 입력용)', tokenBoxX + 24, currentY + tokenBoxH / 2);

  ctx.font = '900 28px "Pretendard", monospace';
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'right';
  ctx.fillText(booth.qrToken, tokenBoxX + tokenBoxW - 24, currentY + tokenBoxH / 2);

  currentY += tokenBoxH + 30;

  // 7. 3-Step Guide Container
  const guideBoxW = width - 160;
  const guideBoxH = 150;
  const guideBoxX = (width - guideBoxW) / 2;

  ctx.fillStyle = '#ECFEFF';
  ctx.strokeStyle = '#A5F3FC';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, guideBoxX, currentY, guideBoxW, guideBoxH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '900 20px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#0E7490';
  ctx.fillText('✨ 체험 스탬프 획득 및 간식 수령 방법', guideBoxX + 20, currentY + 30);

  // 3 Steps columns
  const colW = (guideBoxW - 40) / 3;
  const stepColY = currentY + 50;

  const steps = [
    { num: '1', title: '부스 미션 체험', desc: '운영진의 안내를 받아 재미있게 로봇 미션 참여' },
    { num: '2', title: 'QR 스캔 스탬프', desc: '카메라로 위 QR을 비춰 실시간 인증 스탬프 획득' },
    { num: '3', title: '간식 교환', desc: '부스 완료 후 운영본부에서 맛있는 간식 수령!' },
  ];

  steps.forEach((st, i) => {
    const cx = guideBoxX + 20 + i * colW;
    const cardW = colW - 12;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = i === 2 ? '#FCD34D' : '#CFFAFE';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, cx, stepColY, cardW, 80, 12);
    ctx.fill();
    ctx.stroke();

    // Step Number Badge
    ctx.fillStyle = i === 2 ? '#F59E0B' : '#0891B2';
    drawRoundedRect(ctx, cx + 10, stepColY + 12, 22, 22, 11);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(st.num, cx + 21, stepColY + 23);

    // Step Title
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px "Pretendard", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(st.title, cx + 38, stepColY + 23);

    // Step Desc
    ctx.fillStyle = '#64748B';
    ctx.font = '12px "Pretendard", sans-serif';
    const descLines = wrapText(ctx, st.desc, cardW - 20);
    descLines.forEach((dl, di) => {
      ctx.fillText(dl, cx + 10, stepColY + 48 + di * 16);
    });
  });

  // 8. Footer Note
  const footerY = height - margin - 35;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin + 40, footerY - 20);
  ctx.lineTo(width - margin - 40, footerY - 20);
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = '15px "Pretendard", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('※ QR 인식이 잘 안될 경우 스캔 화면의 [부스 코드 직접 입력]을 이용하세요.', margin + 40, footerY);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 16px "Pretendard", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('K.F.C. 축제 운영본부', width - margin - 40, footerY);

  // 9. Download Trigger
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `KFC_부스_${booth.order}_${booth.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_A4스탠드포스터.png`;
  a.click();
}

/**
 * Generate Standalone Complete HTML for Direct Print & Offline Saving
 */
export function generateStandPrintHTML(booths: Booth[], qrCodeMap: Record<string, string>): string {
  const pagesHTML = booths
    .map(
      (b, idx) => `
    <div class="a4-page ${idx < booths.length - 1 ? 'page-break' : ''}">
      <div class="a4-frame">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>

        <!-- Header -->
        <div class="header">
          <div class="badge-row">
            <span class="festival-pill">K.F.C. FESTIVAL</span>
            <span class="club-title">용인시청소년수련관 로봇동아리</span>
          </div>
          <h1 class="main-title">2026 K.F.C. 로봇 체험 페스티벌</h1>
          <p class="subtitle">🤖 로봇 미션 체험하고 스탬프를 모아보세요! 🎁</p>
        </div>

        <!-- Booth Info -->
        <div class="booth-section">
          <span class="booth-order">BOOTH ${String(b.order || 1).padStart(2, '0')}</span>
          <h2 class="booth-name">${escapeHtml(b.name)}</h2>
          <p class="booth-desc">${escapeHtml(b.description || '')}</p>
          ${
            b.location
              ? `<div class="booth-loc">📍 부스 위치: <strong>${escapeHtml(b.location)}</strong></div>`
              : ''
          }
        </div>

        <!-- QR Code Frame -->
        <div class="qr-container">
          <div class="qr-box">
            ${
              qrCodeMap[b.id]
                ? `<img src="${qrCodeMap[b.id]}" alt="QR for ${escapeHtml(b.name)}" class="qr-img" />`
                : `<div class="qr-placeholder">QR CODE</div>`
            }
          </div>
          <p class="qr-scan-guide">📱 스마트폰 카메라로 QR 코드를 비춰주세요</p>
        </div>

        <!-- Token Box -->
        <div class="token-box">
          <span class="token-label">인증 코드 (수동 입력용)</span>
          <span class="token-code">${escapeHtml(b.qrToken)}</span>
        </div>

        <!-- 3 Step Instruction -->
        <div class="guide-box">
          <div class="guide-title">✨ 체험 스탬프 획득 및 간식 수령 방법</div>
          <div class="guide-steps">
            <div class="step-card">
              <div class="step-header">
                <span class="step-num">1</span>
                <span class="step-name">부스 미션 체험</span>
              </div>
              <p class="step-desc">운영진의 안내를 받아 재미있게 로봇 미션 참여</p>
            </div>
            <div class="step-card">
              <div class="step-header">
                <span class="step-num">2</span>
                <span class="step-name">QR 스캔 스탬프</span>
              </div>
              <p class="step-desc">카메라로 위 QR을 비춰 실시간 인증 스탬프 획득</p>
            </div>
            <div class="step-card step-highlight">
              <div class="step-header">
                <span class="step-num num-accent">3</span>
                <span class="step-name">간식 교환</span>
              </div>
              <p class="step-desc">부스 완료 후 운영본부에서 맛있는 간식 수령!</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <span>※ QR 인식이 잘 안될 경우 스캔 화면의 [부스 코드 직접 입력]을 이용하세요.</span>
          <span class="footer-hq">K.F.C. 축제 운영본부</span>
        </div>
      </div>
    </div>
  `
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>K.F.C. 부스 QR 스탠드 A4 출력물</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
      background: #ffffff;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .a4-page {
      width: 100%;
      height: 280mm;
      max-height: 280mm;
      padding: 6mm;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      box-sizing: border-box;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    .a4-frame {
      width: 100%;
      height: 100%;
      border: 5px solid #0f172a;
      border-radius: 24px;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      position: relative;
      background: #ffffff;
    }
    .corner {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: #0891b2;
      border-style: solid;
    }
    .corner-tl { top: 8px; left: 8px; border-width: 4px 0 0 4px; border-top-left-radius: 6px; }
    .corner-tr { top: 8px; right: 8px; border-width: 4px 4px 0 0; border-top-right-radius: 6px; }
    .corner-bl { bottom: 8px; left: 8px; border-width: 0 0 4px 4px; border-bottom-left-radius: 6px; }
    .corner-br { bottom: 8px; right: 8px; border-width: 0 4px 4px 0; border-bottom-right-radius: 6px; }

    .header { width: 100%; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    .badge-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px; }
    .festival-pill { background: #0891b2; color: #ffffff; font-weight: 900; font-size: 11px; padding: 3px 12px; border-radius: 12px; }
    .club-title { font-size: 12px; font-weight: 700; color: #475569; }
    .main-title { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .subtitle { font-size: 13px; font-weight: 800; color: #0e7490; margin-top: 2px; }

    .booth-section { margin-top: 8px; }
    .booth-order { display: inline-block; background: #0f172a; color: #67e8f9; font-weight: 900; font-size: 12px; padding: 3px 12px; border-radius: 8px; margin-bottom: 4px; }
    .booth-name { font-size: 28px; font-weight: 900; color: #0f172a; line-height: 1.15; }
    .booth-desc { font-size: 13px; font-weight: 600; color: #334155; margin-top: 4px; max-width: 520px; }
    .booth-loc { display: inline-block; background: #ecfeff; border: 1px solid #a5f3fc; color: #0e7490; font-size: 11px; padding: 2px 10px; border-radius: 6px; margin-top: 6px; }

    .qr-container { display: flex; flex-direction: column; align-items: center; margin: 8px 0; }
    .qr-box { width: 230px; height: 230px; border: 4px solid #0f172a; border-radius: 20px; padding: 10px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .qr-img { width: 100%; height: 100%; object-fit: contain; }
    .qr-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; font-weight: 900; color: #94a3b8; }
    .qr-scan-guide { font-size: 13px; font-weight: 900; color: #0891b2; margin-top: 6px; }

    .token-box { width: 100%; max-width: 460px; background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 12px; padding: 6px 16px; display: flex; justify-content: space-between; align-items: center; font-family: monospace; }
    .token-label { font-size: 11px; font-weight: 700; color: #64748b; }
    .token-code { font-size: 16px; font-weight: 900; color: #0f172a; letter-spacing: 2px; }

    .guide-box { width: 100%; background: #ecfeff; border: 1.5px solid #a5f3fc; border-radius: 14px; padding: 8px 12px; text-align: left; margin-top: 6px; }
    .guide-title { font-size: 11px; font-weight: 900; color: #0e7490; margin-bottom: 6px; }
    .guide-steps { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .step-card { background: #ffffff; border: 1px solid #cffafe; border-radius: 8px; padding: 6px 8px; }
    .step-highlight { border-color: #fde68a; }
    .step-header { display: flex; align-items: center; gap: 4px; margin-bottom: 2px; }
    .step-num { width: 16px; height: 16px; background: #0891b2; color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; }
    .num-accent { background: #f59e0b; }
    .step-name { font-size: 11px; font-weight: 900; color: #0f172a; }
    .step-desc { font-size: 9.5px; color: #64748b; line-height: 1.25; }

    .footer { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; font-size: 9.5px; color: #94a3b8; }
    .footer-hq { font-weight: 700; color: #475569; }
  </style>
</head>
<body>
  ${pagesHTML}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;
}

/**
 * Open print window or iframe to trigger flawless A4 printing without blank page issues
 */
export function openStandPrintWindow(booths: Booth[], qrCodeMap: Record<string, string>): void {
  const html = generateStandPrintHTML(booths, qrCodeMap);

  // Try opening a popup window
  const printWindow = window.open('', '_blank', 'width=850,height=1000');
  if (printWindow && printWindow.document) {
    try {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    } catch {
      // Fallback to iframe if document write is blocked
    }
  }

  // Fallback: Invisible print iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print error:', e);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 5000);
      }
    }, 400);
  } else {
    window.print();
  }
}

/**
 * Helper to download raw HTML file for offline printing
 */
export function downloadStandHTMLFile(booths: Booth[], qrCodeMap: Record<string, string>, title: string): void {
  const html = generateStandPrintHTML(booths, qrCodeMap);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}_A4스탠드출력물.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// Helpers
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
