/**
 * Cube Progress Indicator
 * A 3x3 grid progress indicator arranged like a cube's face
 * Supports multiple animation patterns
 */

class CubeProgressIndicator {
    constructor(selector, options = {}) {
        // Support both old API (selector, pattern) and new API (selector, options)
        let pattern = 'sequential';
        if (typeof options === 'string') {
            pattern = options;
            options = {};
        } else {
            pattern = options.pattern || 'sequential';
        }

        this.element = document.querySelector(selector);
        if (!this.element) {
            throw new Error('Cube progress indicator element not found');
        }

        // Auto-create dots if they don't exist
        this.dots = Array.from(this.element.querySelectorAll('.dot'));
        if (this.dots.length === 0) {
            this.createDots();
            this.dots = Array.from(this.element.querySelectorAll('.dot'));
        }

        // Store options
        this.options = {
            pattern: pattern,
            mode: options.mode || 'progress', // 'progress' or 'train'
            autoStart: options.autoStart !== undefined ? options.autoStart : (options.mode === 'train'),
            trainSpeed: options.trainSpeed || 150,
            trainLength: options.trainLength || 5,
            trainPauseDelay: options.trainPauseDelay || 500,
            animationSpeed: options.animationSpeed || 300, // ms per dot for progress animations
            size: options.size || 'medium', // 'small', 'medium', 'large', or custom number (px)
            dotSize: options.dotSize || null, // Custom dot size in px (overrides size)
            gap: options.gap || null, // Custom gap in px (overrides size)
            ...options
        };
        this.currentProgress = 0;
        this.animationSpeed = this.options.animationSpeed;
        this.pattern = this.options.pattern;
        this.trainAnimationId = null;
        this.isTrainRunning = false;
        this.trainSpeed = this.options.trainSpeed;
        this.trainLength = this.options.trainLength;
        this.trainPauseDelay = this.options.trainPauseDelay;
        this.dotsRemainingAfterCenter = 0; // Track how many dots remain after reaching center
        this.currentTrainHeadIndex = 0; // Train head position (now on instance)
        this.currentTrainPatternName = this.options.pattern; // Current pattern name
        this.hasReachedCenter = false; // Flag to track if center has been reached in current cycle

        // Define all animation patterns
        // Grid layout: 0 1 2
        //               3 4 5
        //               6 7 8
        this.patterns = {
            // Sequential patterns
            'sequential': [0, 1, 2, 3, 4, 5, 6, 7, 8], // Left-right, top-bottom
            'vertical': [0, 3, 6, 1, 4, 7, 2, 5, 8], // Top-bottom, left-right
            'reverse': [8, 7, 6, 5, 4, 3, 2, 1, 0], // Right-left, bottom-top
            
            // Spiral patterns
            'anticlockwise-inward': [2, 1, 0, 3, 6, 7, 8, 5, 4], // Anticlockwise spiral inward
            'clockwise-inward': [0, 1, 2, 5, 8, 7, 6, 3, 4], // Clockwise spiral inward
            'anticlockwise-outward': [4, 3, 6, 7, 8, 5, 2, 1, 0], // Anticlockwise spiral outward
            'clockwise-outward': [4, 5, 8, 7, 6, 3, 0, 1, 2], // Clockwise spiral outward
            
            // Diagonal patterns
            'diagonal-lr': [0, 4, 8, 1, 5, 2, 6, 3, 7], // Top-left to bottom-right
            'diagonal-rl': [2, 4, 6, 1, 3, 5, 0, 7, 8], // Top-right to bottom-left
            
            // Zigzag patterns
            'zigzag-horizontal': [0, 1, 2, 5, 4, 3, 6, 7, 8], // Horizontal zigzag
            'zigzag-vertical': [0, 3, 6, 7, 4, 1, 2, 5, 8], // Vertical zigzag
            
            // Center patterns
            'center-outward': [4, 0, 2, 6, 8, 1, 3, 5, 7], // Center to corners
            'corners-first': [0, 2, 6, 8, 1, 3, 5, 7, 4], // Corners then center
            
            // Special patterns
            'snake': [0, 1, 2, 5, 4, 3, 6, 7, 8], // Snake pattern
            'random': [3, 7, 1, 5, 0, 8, 2, 6, 4], // Random order
        };

        this.init();
    }

    createDots() {
        // Ensure element has the cube-progress-indicator class for styling
        if (!this.element.classList.contains('cube-progress-indicator')) {
            this.element.classList.add('cube-progress-indicator');
        }

        // Create 9 dots in a 3x3 grid
        for (let i = 0; i < 9; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.setAttribute('data-index', i);
            this.element.appendChild(dot);
        }
    }

    applySize() {
        // Size presets
        const sizePresets = {
            'small': { container: 15, dot: 3, gap: 2 },
            'medium': { container: 20, dot: 4, gap: 4 },
            'large': { container: 30, dot: 6, gap: 6 },
            'xlarge': { container: 40, dot: 8, gap: 8 }
        };

        let containerSize, dotSize, gapSize;

        // Determine sizes
        if (typeof this.options.size === 'number') {
            // Custom size in px
            containerSize = this.options.size;
            dotSize = this.options.dotSize || (containerSize / 5);
            gapSize = this.options.gap || (containerSize / 5);
        } else if (sizePresets[this.options.size]) {
            // Preset size
            const preset = sizePresets[this.options.size];
            containerSize = preset.container;
            dotSize = this.options.dotSize || preset.dot;
            gapSize = this.options.gap || preset.gap;
        } else {
            // Default medium
            const preset = sizePresets.medium;
            containerSize = preset.container;
            dotSize = this.options.dotSize || preset.dot;
            gapSize = this.options.gap || preset.gap;
        }

        // Apply sizes via CSS custom properties
        this.element.style.setProperty('--cube-size', `${containerSize}px`);
        this.element.style.setProperty('--dot-size', `${dotSize}px`);
        this.element.style.setProperty('--gap-size', `${gapSize}px`);
    }

    init() {
        // Apply size settings
        this.applySize();

        // Set up initial state
        this.updateProgress(0);

        // Add click handlers for individual dots
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const progress = ((index + 1) / this.dots.length) * 100;
                this.setProgress(progress);
            });
        });

        // Auto-start train if mode is 'train' and autoStart is true
        if (this.options.mode === 'train' && this.options.autoStart) {
            this.startTrainEffect(this.options.pattern);
        }
    }

    setProgress(progress) {
        progress = Math.max(0, Math.min(100, progress));
        this.updateProgress(progress);
    }

    setPattern(pattern) {
        if (this.patterns[pattern]) {
            this.pattern = pattern;
            // Update with current progress using new pattern
            this.updateProgress(this.currentProgress);
        }
    }

    setSize(size, dotSize = null, gap = null) {
        // Update size options
        this.options.size = size;
        if (dotSize !== null) this.options.dotSize = dotSize;
        if (gap !== null) this.options.gap = gap;
        
        // Apply new size
        this.applySize();
    }

    getPattern() {
        return this.pattern;
    }

    getAvailablePatterns() {
        return Object.keys(this.patterns);
    }

    // Set train animation speed (in milliseconds)
    setTrainSpeed(speed) {
        if (typeof speed !== 'number' || speed <= 0) {
            console.warn('Train speed must be a positive number');
            return;
        }
        this.trainSpeed = speed;
        this.options.trainSpeed = speed;
        
        // If train is running, restart it with new speed
        if (this.isTrainRunning) {
            const currentPattern = this.currentTrainPatternName;
            this.stopTrainEffect();
            this.startTrainEffect(currentPattern);
        }
    }

    // Get current train speed
    getTrainSpeed() {
        return this.trainSpeed;
    }

    // Set train pause delay (in milliseconds)
    setTrainPauseDelay(delay) {
        if (typeof delay !== 'number' || delay < 0) {
            console.warn('Train pause delay must be a non-negative number');
            return;
        }
        this.trainPauseDelay = delay;
        this.options.trainPauseDelay = delay;
    }

    // Get current train pause delay
    getTrainPauseDelay() {
        return this.trainPauseDelay;
    }

    // Set animation speed for progress mode (in milliseconds per dot)
    setAnimationSpeed(speed) {
        if (typeof speed !== 'number' || speed <= 0) {
            console.warn('Animation speed must be a positive number');
            return;
        }
        this.animationSpeed = speed;
        this.options.animationSpeed = speed;
    }

    // Get current animation speed
    getAnimationSpeed() {
        return this.animationSpeed;
    }

    updateProgress(progress) {
        this.currentProgress = progress;
        const dotsToActivate = Math.round((progress / 100) * this.dots.length);
        const patternOrder = this.patterns[this.pattern] || this.patterns['sequential'];

        // Reset all dots
        this.dots.forEach((dot) => {
            dot.classList.remove('active', 'completed');
        });

        // Fill dots according to the selected pattern
        for (let i = 0; i < dotsToActivate; i++) {
            const dotIndex = patternOrder[i];
            if (dotIndex !== undefined && this.dots[dotIndex]) {
                this.dots[dotIndex].classList.add('completed');
            }
        }
    }

    getProgress() {
        return this.currentProgress;
    }

    // Utility method to animate progress over time
    animateTo(progress, duration = 2000) {
        const startProgress = this.currentProgress;
        const difference = progress - startProgress;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progressRatio = Math.min(elapsed / duration, 1);
            const currentProgress = startProgress + (difference * this.easeInOutQuad(progressRatio));

            this.updateProgress(currentProgress);

            if (progressRatio < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Easing function for smooth animation
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Reset to 0
    reset() {
        this.setProgress(0);
    }

    // Complete all dots
    complete() {
        this.setProgress(100);
    }

    // Train effect animation - continuously loops through pattern
    startTrainEffect(patternName = null) {
        // Stop any existing train
        this.stopTrainEffect();

        // Set pattern
        this.currentTrainPatternName = patternName 
            || this.pattern 
            || 'anticlockwise-inward';

        const patternOrder = this.patterns[this.currentTrainPatternName];
        if (!patternOrder) {
            console.error('Pattern not found:', this.currentTrainPatternName);
            return;
        }

        // Reset state
        this.currentTrainHeadIndex = 0;
        this.dotsRemainingAfterCenter = 0;
        this.hasReachedCenter = false;
        this.isTrainRunning = true;

        // Clean all dots
        this.dots.forEach(dot => {
            dot.classList.remove('train', 'converging', 'center-flash');
            dot.style.cssText = ''; // Reset inline styles safely
        });

        const animate = () => {
            if (!this.isTrainRunning) return;

            // Always clear previous train visuals
            this.dots.forEach(dot => {
                dot.classList.remove('train', 'converging', 'center-flash');
            });

            let trainDots = [];

            // PHASE 1: Train is moving toward center
            if (this.currentTrainHeadIndex < patternOrder.length - 1) {
                const startPos = Math.max(0, this.currentTrainHeadIndex - this.trainLength + 1);
                const dotIndices = [];
                for (let i = startPos; i <= this.currentTrainHeadIndex; i++) {
                    const dotIndex = patternOrder[i];
                    dotIndices.push(dotIndex);
                    trainDots.push(this.dots[dotIndex]);
                }
                // Move head forward
                this.currentTrainHeadIndex++;
            }
            // PHASE 2: Center reached → fade out from the front
            else {
                // First time reaching center?
                if (!this.hasReachedCenter) {
                    this.hasReachedCenter = true;
                    this.dotsRemainingAfterCenter = this.trainLength;
                }

                // Show only the last N dots (shrinking from the front)
                const dotIndices = [];
                if (this.dotsRemainingAfterCenter > 0) {
                    const startPos = patternOrder.length - this.dotsRemainingAfterCenter;
                    for (let i = startPos; i < patternOrder.length; i++) {
                        const dotIndex = patternOrder[i];
                        dotIndices.push(dotIndex);
                        trainDots.push(this.dots[dotIndex]);
                    }
                }
                this.dotsRemainingAfterCenter--;

                // When fully faded out → restart after pause
                if (this.dotsRemainingAfterCenter < 0) {
                    const shouldRestart = this.isTrainRunning; // capture state
                    this.isTrainRunning = false; // prevent race
                    setTimeout(() => {
                        if (shouldRestart) {
                            this.startTrainEffect(this.currentTrainPatternName);
                        }
                    }, this.trainPauseDelay);
                    return; // exit animate loop
                }
            }

            // Apply white glow to current train segment
            trainDots.forEach(dot => dot.classList.add('train'));

            // Schedule next frame
            this.trainAnimationId = setTimeout(animate, this.trainSpeed);
        };

        // Start animation
        animate();
    }




    stopTrainEffect() {
        this.isTrainRunning = false;
        if (this.trainAnimationId) {
            clearTimeout(this.trainAnimationId);
            this.trainAnimationId = null;
        }
        this.dots.forEach(dot => {
            dot.classList.remove('train', 'converging', 'center-flash', 'active', 'completed');
            dot.style.cssText = '';
        });
    }

    isTrainEffectRunning() {
        return this.isTrainRunning;
    }
}

// Demo functionality
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if the element exists (for demo page)
    const indicatorElement = document.querySelector('.cube-progress-indicator');
    if (!indicatorElement) return;
    
    const indicator = new CubeProgressIndicator('.cube-progress-indicator');
    const progressInput = document.getElementById('progressInput');
    const progressValue = document.getElementById('progressValue');
    const presetButtons = document.querySelectorAll('.preset-btn');
    const patternSelect = document.getElementById('patternSelect');
    const trainToggleBtn = document.getElementById('trainToggleBtn');

    // Update progress when slider changes
    if (progressInput && progressValue) {
        progressInput.addEventListener('input', function() {
        // Stop train effect when manually adjusting progress
        if (indicator.isTrainEffectRunning()) {
            indicator.stopTrainEffect();
            if (trainToggleBtn) {
                trainToggleBtn.checked = false;
            }
        }
            const progress = parseInt(this.value);
            progressValue.textContent = progress;
            indicator.setProgress(progress);
        });
    }

    // Preset buttons
    if (presetButtons && presetButtons.length > 0) {
        presetButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Stop train effect when using preset buttons
                if (indicator.isTrainEffectRunning()) {
                    indicator.stopTrainEffect();
                    if (trainToggleBtn) {
                        trainToggleBtn.checked = false;
                    }
                }
                const progress = parseInt(this.dataset.progress);
                if (progressInput) progressInput.value = progress;
                if (progressValue) progressValue.textContent = progress;
                indicator.setProgress(progress);
            });
        });
    }

    // Pattern selector
    if (patternSelect) {
        const patterns = indicator.getAvailablePatterns();
        patterns.forEach(pattern => {
            const option = document.createElement('option');
            option.value = pattern;
            option.textContent = pattern.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            patternSelect.appendChild(option);
        });

        patternSelect.addEventListener('change', function() {
            const wasTrainRunning = indicator.isTrainEffectRunning();
            if (wasTrainRunning) {
                indicator.stopTrainEffect();
            }
            indicator.setPattern(this.value);
            // For train effect, keep empty grey dots
            indicator.setProgress(0);
            if (wasTrainRunning) {
                indicator.startTrainEffect(this.value);
            }
        });
    }

    // Train effect toggle switch
    if (trainToggleBtn) {
        trainToggleBtn.addEventListener('change', function() {
            if (this.checked) {
                const pattern = patternSelect ? patternSelect.value : 'anticlockwise-inward';
                indicator.startTrainEffect(pattern);
            } else {
                indicator.stopTrainEffect();
            }
        });
    }

    // Initialize with empty grey dots, ready for train effect (only on demo page)
    if (trainToggleBtn) {
        indicator.setPattern('anticlockwise-inward');
        indicator.setProgress(0); // Show empty grey dots initially
        // Start train effect immediately
        indicator.startTrainEffect('anticlockwise-inward');
        trainToggleBtn.checked = true;
    }
});