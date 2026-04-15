export type EffectCategory = "none" | "hats" | "glasses" | "masks" | "particles";

export interface AREffect {
  id: string;
  name: string;
  category: EffectCategory;
  emoji: string;
}

export const effects: AREffect[] = [
  { id: "none", name: "None", category: "none", emoji: "✨" },
  { id: "tophat", name: "Top Hat", category: "hats", emoji: "🎩" },
  { id: "crown", name: "Crown", category: "hats", emoji: "👑" },
  { id: "partyhat", name: "Party", category: "hats", emoji: "🎉" },
  { id: "sunglasses", name: "Cool", category: "glasses", emoji: "😎" },
  { id: "hearts", name: "Hearts", category: "glasses", emoji: "❤️" },
  { id: "stars", name: "Stars", category: "glasses", emoji: "⭐" },
  { id: "dog", name: "Dog", category: "masks", emoji: "🐶" },
  { id: "cat", name: "Cat", category: "masks", emoji: "🐱" },
  { id: "sparkle", name: "Sparkle", category: "particles", emoji: "✨" },
  { id: "fire", name: "Fire", category: "particles", emoji: "🔥" },
];

export const categories: { id: EffectCategory; label: string; emoji: string }[] = [
  { id: "none", label: "Off", emoji: "❌" },
  { id: "hats", label: "Hats", emoji: "🎩" },
  { id: "glasses", label: "Glasses", emoji: "👓" },
  { id: "masks", label: "Masks", emoji: "🎭" },
  { id: "particles", label: "Effects", emoji: "✨" },
];

// Draw AR effect on canvas using face landmarks
export function drawEffect(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number }[],
  effectId: string,
  width: number,
  height: number,
  time: number
) {
  if (effectId === "none" || !landmarks.length) return;

  // Key landmark indices for Face Mesh
  const forehead = landmarks[10]; // top of head
  const nose = landmarks[1]; // nose tip
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const chin = landmarks[152];

  const eyeDistance = Math.sqrt(
    Math.pow((rightEye.x - leftEye.x) * width, 2) +
    Math.pow((rightEye.y - leftEye.y) * height, 2)
  );

  const eyeCenterX = ((leftEye.x + rightEye.x) / 2) * width;
  const eyeCenterY = ((leftEye.y + rightEye.y) / 2) * height;
  const faceAngle = Math.atan2(
    (rightEye.y - leftEye.y) * height,
    (rightEye.x - leftEye.x) * width
  );

  ctx.save();

  switch (effectId) {
    case "tophat": {
      const hx = forehead.x * width;
      const hy = forehead.y * height;
      const size = eyeDistance * 2;
      ctx.translate(hx, hy);
      ctx.rotate(faceAngle);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(-size / 2, -size * 0.9, size, size * 0.6);
      ctx.fillRect(-size * 0.7, -size * 0.35, size * 1.4, size * 0.12);
      ctx.strokeStyle = "hsl(167, 80%, 55%)";
      ctx.lineWidth = 3;
      ctx.strokeRect(-size / 2, -size * 0.9, size, size * 0.6);
      ctx.fillStyle = "hsl(167, 80%, 55%)";
      ctx.fillRect(-size / 2, -size * 0.4, size, size * 0.06);
      break;
    }
    case "crown": {
      const hx = forehead.x * width;
      const hy = forehead.y * height;
      const size = eyeDistance * 2;
      ctx.translate(hx, hy);
      ctx.rotate(faceAngle);
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, -size * 0.1);
      ctx.lineTo(-size * 0.6, -size * 0.6);
      ctx.lineTo(-size * 0.3, -size * 0.35);
      ctx.lineTo(0, -size * 0.7);
      ctx.lineTo(size * 0.3, -size * 0.35);
      ctx.lineTo(size * 0.6, -size * 0.6);
      ctx.lineTo(size * 0.6, -size * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#B8860B";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Jewels
      ctx.fillStyle = "#FF0040";
      ctx.beginPath(); ctx.arc(0, -size * 0.45, size * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#00FFAA";
      ctx.beginPath(); ctx.arc(-size * 0.3, -size * 0.25, size * 0.04, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(size * 0.3, -size * 0.25, size * 0.04, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "partyhat": {
      const hx = forehead.x * width;
      const hy = forehead.y * height;
      const size = eyeDistance * 1.5;
      ctx.translate(hx, hy);
      ctx.rotate(faceAngle);
      const grad = ctx.createLinearGradient(0, -size, 0, 0);
      grad.addColorStop(0, "hsl(330, 80%, 60%)");
      grad.addColorStop(0.5, "hsl(280, 70%, 60%)");
      grad.addColorStop(1, "hsl(167, 80%, 55%)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.2);
      ctx.lineTo(-size * 0.5, -size * 0.1);
      ctx.lineTo(size * 0.5, -size * 0.1);
      ctx.closePath();
      ctx.fill();
      // Pom pom
      ctx.fillStyle = "#FFD700";
      ctx.beginPath(); ctx.arc(0, -size * 1.2, size * 0.1, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "sunglasses": {
      ctx.translate(eyeCenterX, eyeCenterY);
      ctx.rotate(faceAngle);
      const lensW = eyeDistance * 0.65;
      const lensH = eyeDistance * 0.45;
      const gap = eyeDistance * 0.15;
      // Lenses
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 3;
      roundRect(ctx, -gap - lensW, -lensH / 2, lensW, lensH, 8);
      roundRect(ctx, gap, -lensH / 2, lensW, lensH, 8);
      // Bridge
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-gap, 0);
      ctx.lineTo(gap, 0);
      ctx.stroke();
      // Lens reflection
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.ellipse(-gap - lensW * 0.5, -lensH * 0.1, lensW * 0.2, lensH * 0.15, -0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "hearts": {
      ctx.translate(eyeCenterX, eyeCenterY);
      ctx.rotate(faceAngle);
      const hs = eyeDistance * 0.35;
      drawHeart(ctx, -eyeDistance * 0.35, 0, hs, "rgba(255, 0, 80, 0.8)");
      drawHeart(ctx, eyeDistance * 0.35, 0, hs, "rgba(255, 0, 80, 0.8)");
      break;
    }
    case "stars": {
      ctx.translate(eyeCenterX, eyeCenterY);
      ctx.rotate(faceAngle);
      const ss = eyeDistance * 0.3;
      drawStar(ctx, -eyeDistance * 0.35, 0, ss, "#FFD700");
      drawStar(ctx, eyeDistance * 0.35, 0, ss, "#FFD700");
      break;
    }
    case "dog": {
      // Dog nose
      const nx = nose.x * width;
      const ny = nose.y * height;
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(nx, ny, eyeDistance * 0.15, eyeDistance * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#333";
      ctx.beginPath(); ctx.arc(nx - eyeDistance * 0.04, ny - eyeDistance * 0.02, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(nx + eyeDistance * 0.04, ny - eyeDistance * 0.02, 3, 0, Math.PI * 2); ctx.fill();
      // Tongue
      const mx = ((leftMouth.x + rightMouth.x) / 2) * width;
      const my = ((leftMouth.y + rightMouth.y) / 2) * height;
      ctx.fillStyle = "#FF6B8A";
      ctx.beginPath();
      ctx.ellipse(mx, my + eyeDistance * 0.25, eyeDistance * 0.12, eyeDistance * 0.2, 0, 0, Math.PI);
      ctx.fill();
      // Ears
      const earSize = eyeDistance * 0.6;
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.ellipse(leftEye.x * width - earSize * 0.6, leftEye.y * height - earSize * 0.3, earSize * 0.3, earSize * 0.8, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEye.x * width + earSize * 0.6, rightEye.y * height - earSize * 0.3, earSize * 0.3, earSize * 0.8, 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "cat": {
      // Cat ears
      const earW = eyeDistance * 0.4;
      const earH = eyeDistance * 0.8;
      const headTop = forehead.y * height;
      ctx.fillStyle = "#555";
      ctx.beginPath();
      ctx.moveTo(leftEye.x * width - earW, headTop);
      ctx.lineTo(leftEye.x * width, headTop - earH);
      ctx.lineTo(leftEye.x * width + earW * 0.3, headTop);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(rightEye.x * width - earW * 0.3, headTop);
      ctx.lineTo(rightEye.x * width, headTop - earH);
      ctx.lineTo(rightEye.x * width + earW, headTop);
      ctx.closePath();
      ctx.fill();
      // Inner ear
      ctx.fillStyle = "#FFB6C1";
      ctx.beginPath();
      ctx.moveTo(leftEye.x * width - earW * 0.5, headTop);
      ctx.lineTo(leftEye.x * width, headTop - earH * 0.6);
      ctx.lineTo(leftEye.x * width + earW * 0.1, headTop);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(rightEye.x * width - earW * 0.1, headTop);
      ctx.lineTo(rightEye.x * width, headTop - earH * 0.6);
      ctx.lineTo(rightEye.x * width + earW * 0.5, headTop);
      ctx.closePath();
      ctx.fill();
      // Whiskers
      const wn = nose.x * width;
      const wny = nose.y * height;
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j++) {
          ctx.beginPath();
          ctx.moveTo(wn, wny + j * 5);
          ctx.lineTo(wn + i * eyeDistance * 0.7, wny + j * 12 - 5);
          ctx.stroke();
        }
      }
      // Cat nose
      ctx.fillStyle = "#FFB6C1";
      ctx.beginPath();
      ctx.moveTo(wn, wny - 4);
      ctx.lineTo(wn - 6, wny + 4);
      ctx.lineTo(wn + 6, wny + 4);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "sparkle": {
      const numParticles = 12;
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2 + time * 0.002;
        const radius = eyeDistance * (0.8 + Math.sin(time * 0.003 + i) * 0.3);
        const px = eyeCenterX + Math.cos(angle) * radius;
        const py = eyeCenterY + Math.sin(angle) * radius;
        const size = 3 + Math.sin(time * 0.005 + i * 0.5) * 2;
        ctx.fillStyle = `hsl(${(time * 0.1 + i * 30) % 360}, 80%, 70%)`;
        drawStar(ctx, px - eyeCenterX, py - eyeCenterY, size, ctx.fillStyle);
      }
      break;
    }
    case "fire": {
      const numFlames = 8;
      for (let i = 0; i < numFlames; i++) {
        const fx = forehead.x * width + (Math.random() - 0.5) * eyeDistance * 2;
        const fy = forehead.y * height - Math.random() * eyeDistance * 1.5;
        const fs = 5 + Math.random() * 10;
        const hue = 20 + Math.random() * 30;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.4 + Math.random() * 0.4})`;
        ctx.beginPath();
        ctx.arc(fx, fy, fs, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.3);
  ctx.bezierCurveTo(x - size, y + size * 0.7, x, y + size, x, y + size * 1.2);
  ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.7, x + size, y + size * 0.3);
  ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const method = i === 0 ? "moveTo" : "lineTo";
    ctx[method](x + Math.cos(angle) * size, y + Math.sin(angle) * size);
  }
  ctx.closePath();
  ctx.fill();
}
