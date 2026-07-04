import confetti from "canvas-confetti";

export function fireConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ["#D4AF37", "#E8D5A3", "#FAF9F6"],
  });
  fire(0.2, {
    spread: 60,
    colors: ["#D4AF37", "#111111", "#FAF9F6"],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ["#D4AF37", "#E8D5A3"],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ["#D4AF37", "#FAF9F6"],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ["#D4AF37", "#E8D5A3", "#111111"],
  });
}
