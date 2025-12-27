function startFallingLogos() {
    // Inject CSS styles if not already present
    if (!document.getElementById('falling-logos-styles')) {
        const style = document.createElement('style');
        style.id = 'falling-logos-styles';
        style.textContent = `
            body {
                margin: 0;
                overflow: hidden;
                position: relative;
            }
            #subscribe-btn {
                padding: 10px 20px;
                font-size: 18px;
                cursor: pointer;
                background-color: #1DA1F2;
                border: none;
                color: white;
                border-radius: 5px;
                z-index: 10;
                position: relative;
            }
            .falling-logo {
                position: absolute;
                width: 50px;
                height: auto;
                opacity: 0.8;
                pointer-events: none;
                top: -50px;
                transform: rotate(var(--rotation));
                animation: fall linear forwards;
            }
            @keyframes fall {
                0% {
                    transform: translateY(0) rotate(var(--rotation));
                    opacity: 1;
                }
                100% {
                    transform: translateY(calc(100vh + 50px)) rotate(var(--rotation));
                    opacity: 0.5;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // // Check if button exists, create it if not
    // let subscribeBtn = document.getElementById('subscribe-btn');
    // if (!subscribeBtn) {
    //     subscribeBtn = document.createElement('button');
    //     subscribeBtn.id = 'subscribe-btn';
    //     subscribeBtn.textContent = 'Subscribe to Premium';
    //     document.body.appendChild(subscribeBtn);
    // }

    // Falling logo logic
    function createFallingLogo() {
        const logo = document.createElement('img');
        logo.src = 'https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png';
        logo.className = 'falling-logo';
        logo.style.left = `${Math.random() * (window.innerWidth - 50)}px`;
        logo.style.animationDuration = `${Math.random() * 3 + 3}s`;
        const fixedRotation = Math.random() * 90 - 45; // -45 to 45 degrees
        logo.style.setProperty('--rotation', `${fixedRotation}deg`);
        document.body.appendChild(logo);

        logo.addEventListener('animationend', () => {
            logo.remove();
        });
    }

    // Trigger the falling logos
    for (let i = 0; i < 20; i++) {
        createFallingLogo();
    }

    // Optional: Add click event to button if you want it interactive
    subscribeBtn.addEventListener('click', () => {
        for (let i = 0; i < 20; i++) {
            createFallingLogo();
        }
    });
}

// Export the function globally (for browser use)
window.startFallingLogos = startFallingLogos;