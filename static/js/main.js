(() => {
    document.documentElement.classList.add("js-ready");

    const canvas = document.getElementById("particleCanvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    let particles = [];
    let pointer = { x: -1000, y: -1000 };

    function resizeCanvas() {
        if (!canvas || !ctx) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * ratio;
        canvas.height = window.innerHeight * ratio;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        const count = Math.min(80, Math.max(35, Math.floor(window.innerWidth / 24)));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.18,
            vy: (Math.random() - 0.5) * 0.18,
            r: Math.random() * 1.5 + 0.4,
            a: Math.random() * 0.35 + 0.08
        }));
    }

    function animateParticles() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -10) p.x = window.innerWidth + 10;
            if (p.x > window.innerWidth + 10) p.x = -10;
            if (p.y < -10) p.y = window.innerHeight + 10;
            if (p.y > window.innerHeight + 10) p.y = -10;

            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const glow = distance < 160 ? (1 - distance / 160) * 0.32 : 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r + glow * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(111, 226, 255, ${p.a + glow})`;
            ctx.fill();
        });

        requestAnimationFrame(animateParticles);
    }

    window.addEventListener("mousemove", e => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
    });

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animateParticles();

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

    document.querySelectorAll(".counter").forEach(counter => {
        const target = Number(counter.dataset.target || 0);
        let started = false;

        const counterObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting || started) return;
                started = true;
                let value = 0;
                const duration = 900;
                const start = performance.now();

                function tick(now) {
                    const progress = Math.min((now - start) / duration, 1);
                    value = Math.round(target * (1 - Math.pow(1 - progress, 3)));
                    counter.textContent = value;
                    if (progress < 1) requestAnimationFrame(tick);
                }

                requestAnimationFrame(tick);
                counterObserver.disconnect();
            });
        }, { threshold: 0.4 });

        counterObserver.observe(counter);
    });

    document.querySelectorAll(".tilt-card").forEach(card => {
        card.addEventListener("mousemove", e => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(1000px) rotateX(${-py * 6}deg) rotateY(${px * 7}deg) translateY(-3px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });
    });

    document.querySelectorAll(".magnetic").forEach(button => {
        button.addEventListener("mousemove", e => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            button.style.transform = `translate(${x * 0.04}px, ${y * 0.08}px)`;
        });

        button.addEventListener("mouseleave", () => {
            button.style.transform = "";
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const target = document.querySelector(link.getAttribute("href"));
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
})();