"use client";

import { useEffect, useRef } from "react";

export default function VectorGraphCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // AI Hub Network Nodes: Gateway, Gemini Vision, Groq LPU, Schema Repair, Cost Telemetry
    const nodes = [
      { x: 300, y: 110, r: 28, label: "API Gateway [/invoke]", vx: 0.15, vy: 0.2 },
      { x: 390, y: 220, r: 20, label: "Groq LPU [210ms]", vx: -0.2, vy: 0.15 },
      { x: 410, y: 350, r: 24, label: "Gemini Vision [Multimodal]", vx: 0.1, vy: -0.15 },
      { x: 300, y: 440, r: 32, label: "Schema Repair [JSON OK]", vx: -0.15, vy: -0.2 },
      { x: 230, y: 330, r: 18, label: "Telemetry [Tokens/Cost]", vx: 0.2, vy: -0.1 },
    ];

    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      t += 0.01;

      // Animate subtle node floating
      nodes.forEach((node, i) => {
        const floatX = Math.sin(t + i * 1.5) * 6;
        const floatY = Math.cos(t + i * 1.2) * 6;
        (node as any).currentX = node.x + floatX;
        (node as any).currentY = node.y + floatY;
      });

      // Draw connecting lines / loop
      ctx.beginPath();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;

      for (let i = 0; i < nodes.length; i++) {
        const curr = nodes[i] as any;
        const next = nodes[(i + 1) % nodes.length] as any;

        const midX = (curr.currentX + next.currentX) / 2;
        const midY = (curr.currentY + next.currentY) / 2;

        if (i === 0) {
          ctx.moveTo(curr.currentX, curr.currentY);
        }
        ctx.quadraticCurveTo(curr.currentX, curr.currentY, midX, midY);
      }
      ctx.closePath();
      ctx.stroke();

      // Diagonal cross connection
      ctx.beginPath();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      const n0 = nodes[0] as any;
      const n2 = nodes[2] as any;
      ctx.moveTo(n0.currentX, n0.currentY);
      ctx.lineTo(n2.currentX, n2.currentY);
      ctx.stroke();

      // Traveling packet animation
      const travelIdx = Math.floor(t % nodes.length);
      const nextIdx = (travelIdx + 1) % nodes.length;
      const progress = (t % 1);
      const pA = nodes[travelIdx] as any;
      const pB = nodes[nextIdx] as any;
      const particleX = pA.currentX + (pB.currentX - pA.currentX) * progress;
      const particleY = pA.currentY + (pB.currentY - pA.currentY) * progress;

      ctx.beginPath();
      ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();

      // Draw nodes
      nodes.forEach((node: any) => {
        // Outer faint glow ring
        ctx.beginPath();
        ctx.arc(node.currentX, node.currentY, node.r + 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(224, 120, 80, 0.25)";
        ctx.fill();

        // Main node circle
        ctx.beginPath();
        ctx.arc(node.currentX, node.currentY, node.r, 0, Math.PI * 2);
        ctx.fillStyle = "#e07850";
        ctx.fill();

        // Center dot
        if (node.r > 30) {
          ctx.beginPath();
          ctx.arc(node.currentX, node.currentY, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#000000";
          ctx.fill();
        }

        // Coordinate / label
        ctx.font = "11px 'Space Mono', monospace";
        ctx.fillStyle = "#666666";
        ctx.fillText(node.label, node.currentX + node.r + 8, node.currentY + 4);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={580}
        height={540}
        className="w-full max-w-[580px] h-auto pointer-events-none select-none"
      />
    </div>
  );
}
