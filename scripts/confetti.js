function createConfettiEffect() {
    const canvas = document.getElementById('confetti');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animation;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 15 + 1;
            this.speedX = Math.random() * 10 - 5;
            this.speedY = Math.random() * 10 - 5;
            this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.size > 0.1) this.size -= 0.1;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.fillRect(this.x, this.y, this.size, this.size);
            ctx.closePath();
        }
    }

    function createParticles(xPos, yPos) {
        for (let i = 0; i < 200; i++) {
            particles.push(new Particle(xPos, yPos));
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            if (particles[i].size <= 0.1) {
                particles.splice(i, 1);
                i--;
            }
        }

        if (particles.length) {
            animation = requestAnimationFrame(animateParticles);
        } else {
            cancelAnimationFrame(animation);
            canvas.style.display = 'none';
        }
    }

    function start(xPos, yPos) {
        canvas.style.display = 'block';
        createParticles(xPos, yPos);
        animateParticles();
        setTimeout(() => {
            particles = [];
        }, 15000); // Duration of the confetti effect in milliseconds
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    return {
        start,
    };
}
