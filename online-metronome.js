/*
(C) prepphint.com all right reserved.
*/
document.addEventListener('DOMContentLoaded', () => {
    const gnomeContainer = document.getElementById("unique-metrognome");
    const gnomeMouth = gnomeContainer.querySelector(".unique-mouth");
    const gnomeBeard = gnomeContainer.querySelector(".unique-beard");
    const gnomeStacheLeft = gnomeContainer.querySelector(".unique-stache.left");
    const gnomeStacheRight = gnomeContainer.querySelector(".unique-stache.right");
    const tempoSlider = document.getElementById("unique-tempo");
    const bpm = document.getElementById("unique-bpm");
    const playBtn = document.getElementById("unique-play");
    const toggleThemeBtn = document.getElementById("unique-toggle-theme");
    const tapTempoBtn = document.getElementById("unique-tap-tempo");
    const timeSignatureSelect = document.getElementById("unique-time-signature");
    const subdivisionSelect = document.getElementById("unique-subdivision");
    const beatDotsContainer = document.getElementById("unique-beat-dots");
    let isPlaying = false;
    let metronomeStartTimer;
    let tapTimes = [];

    class Metronome {
        constructor(tempo = 120, beatsPerMeasure = 4, subdivision = 1) {
            this.audioContext = null;
            this.notesInQueue = [];
            this.currentQuarterNote = 0;
            this.tempo = tempo;
            this.beatsPerMeasure = beatsPerMeasure;
            this.subdivision = subdivision;
            this.lookahead = 25;
            this.scheduleAheadTime = 0.1;
            this.nextNoteTime = 0.0;
            this.isRunning = false;
            this.intervalID = null;
        }

        nextNote() {
            var secondsPerBeat = 60 / this.tempo / this.subdivision;
            this.nextNoteTime += secondsPerBeat;

            this.currentQuarterNote++;
            animSwing.duration(secondsPerBeat * this.subdivision);
            animTalk.duration(secondsPerBeat / 2);

            if (this.currentQuarterNote == this.beatsPerMeasure * this.subdivision) {
                this.currentQuarterNote = 0;
            }
        }

        scheduleNote(beatNumber, time) {
            this.notesInQueue.push({ note: beatNumber, time: time });

            const osc = this.audioContext.createOscillator();
            const envelope = this.audioContext.createGain();

            let frequency = 800;
            let color = '#FF0000'; // red for primary beats
            if (beatNumber % this.subdivision === 0) {
                if (beatNumber % (this.beatsPerMeasure * this.subdivision) === 0) {
                    frequency = 1000;
                    color = '#00FF00'; // green for measure start
                } else {
                    frequency = 600;
                    color = '#0000FF'; // blue for regular beats
                }
            } else {
                frequency = 400;
                color = '#FFFF00'; // yellow for subdivisions
            }

            osc.frequency.value = frequency;
            envelope.gain.value = 1;
            envelope.gain.exponentialRampToValueAtTime(1, time + 0.01);
            envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

            osc.connect(envelope);
            envelope.connect(this.audioContext.destination);

            osc.start(time);
            osc.stop(time + 0.03);

            const dotIndex = beatNumber % (this.beatsPerMeasure * this.subdivision);
            const dots = document.querySelectorAll('.unique-beat-dot');
            dots.forEach((dot, index) => {
                if (index === dotIndex) {
                    dot.style.backgroundColor = color;
                } else {
                    dot.style.backgroundColor = 'var(--color-dot)';
                }
            });
        }

        scheduler() {
            while (
                this.nextNoteTime <
                this.audioContext.currentTime + this.scheduleAheadTime
            ) {
                this.scheduleNote(this.currentQuarterNote, this.nextNoteTime);
                this.nextNote();
            }
        }

        start() {
            if (this.isRunning) return;

            if (this.audioContext == null) {
                this.audioContext = new window.AudioContext();
            }

            this.isRunning = true;
            this.currentQuarterNote = 0;
            this.nextNoteTime = this.audioContext.currentTime + 0.05;
            this.intervalID = setInterval(() => this.scheduler(), this.lookahead);
        }

        stop() {
            this.isRunning = false;
            clearInterval(this.intervalID);
        }
    }

    const metronome = new Metronome();
    const startupDuration = 600;
    const rotationDeg = 25;

    const animStart = gsap
        .timeline({
            paused: true
        })
        .to(gnomeContainer, {
            rotate: rotationDeg * -1,
            ease: "back.in(2)",
            duration: startupDuration / 1000,
            onComplete: () => {
                animSwing.restart();
                animTalk.restart();
            }
        })
        .to(
            gnomeStacheLeft,
            {
                rotate: -10
            },
            "<"
        )
        .to(
            gnomeStacheRight,
            {
                rotate: 10
            },
            "<"
        );

    const animStop = gsap
        .timeline({ paused: true })
        .to(gnomeContainer, {
            rotate: 0,
            ease: "elastic.out(1, 0.3)",
            duration: 1.4
        })
        .to(
            gnomeMouth,
            {
                scaleX: 0,
                scaleY: 0,
                duration: 0.2
            },
            "<"
        )
        .to(
            [gnomeStacheLeft, gnomeStacheRight],
            {
                rotate: 0
            },
            "<"
        );

    const animSwing = gsap
        .timeline({
            repeat: -1,
            yoyo: true,
            paused: true
        })
        .fromTo(
            gnomeContainer,
            { rotate: rotationDeg * -1 },
            {
                rotate: rotationDeg,
                ease: "linear",
                immediateRender: false,
                onStart: () => animTalk.restart()
            }
        );

    const animTalk = gsap
        .timeline({
            repeat: -1,
            yoyo: true,
            paused: true
        })
        .fromTo(
            gnomeMouth,
            { scaleX: 1, scaleY: 1 },
            {
                scaleX: 1,
                scaleY: 0,
                ease: "expo.out",
                immediateRender: false
            }
        )
        .fromTo(
            gnomeStacheLeft,
            { rotate: -10 },
            {
                rotate: 0,
                ease: "sine.in",
                immediateRender: false
            },
            "<"
        )
        .fromTo(
            gnomeStacheRight,
            { rotate: 10 },
            {
                rotate: 0,
                ease: "sine.in",
                immediateRender: false
            },
            "<"
        );

    tempoSlider.addEventListener("input", () => {
        bpm.textContent = tempoSlider.value;
        metronome.tempo = tempoSlider.value;
        localStorage.setItem('tempo', tempoSlider.value);
    });

    function play() {
        isPlaying = true;
        playBtn.textContent = "Pause";
        animStop.invalidate().pause();
        animStart.restart();
        metronomeStartTimer = setTimeout(() => metronome.start(), startupDuration);
    }

    function pause() {
        isPlaying = false;
        clearTimeout(metronomeStartTimer);
        playBtn.textContent = "Play";
        animTalk.invalidate().pause();
        animSwing.invalidate().pause();
        animStart.invalidate().pause();
        animStop.restart();
        metronome.stop();
    }

    playBtn.addEventListener("click", () => (isPlaying ? pause() : play()));

    // Tap Tempo feature
    tapTempoBtn.addEventListener("click", () => {
        const now = Date.now();
        tapTimes.push(now);
        if (tapTimes.length > 8) tapTimes.shift(); // Limit to last 8 taps

        if (tapTimes.length > 1) {
            const intervals = tapTimes.slice(1).map((time, index) => time - tapTimes[index]);
            const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const tapBPM = Math.round(60000 / averageInterval);
            tempoSlider.value = tapBPM;
            bpm.textContent = tapBPM;
            metronome.tempo = tapBPM;
            localStorage.setItem('tempo', tapBPM);
        }
    });

    // Time Signature and Subdivision
    timeSignatureSelect.addEventListener("change", () => {
        const [beatsPerMeasure] = timeSignatureSelect.value.split('/').map(Number);
        metronome.beatsPerMeasure = beatsPerMeasure;
        localStorage.setItem('timeSignature', timeSignatureSelect.value);
        updateBeatDots(beatsPerMeasure * metronome.subdivision);
        updateGnomePosition(); // Ensure the gnome stays centered
    });

    subdivisionSelect.addEventListener("change", () => {
        metronome.subdivision = Number(subdivisionSelect.value);
        localStorage.setItem('subdivision', subdivisionSelect.value);
        updateBeatDots(metronome.beatsPerMeasure * metronome.subdivision);
        updateGnomePosition(); // Ensure the gnome stays centered
    });

    // Load saved settings
    const savedTempo = localStorage.getItem('tempo');
    if (savedTempo) {
        tempoSlider.value = savedTempo;
        bpm.textContent = savedTempo;
        metronome.tempo = savedTempo;
    }

    const savedTimeSignature = localStorage.getItem('timeSignature');
    if (savedTimeSignature) {
        timeSignatureSelect.value = savedTimeSignature;
        const [beatsPerMeasure] = savedTimeSignature.split('/').map(Number);
        metronome.beatsPerMeasure = beatsPerMeasure;
    }

    const savedSubdivision = localStorage.getItem('subdivision');
    if (savedSubdivision) {
        subdivisionSelect.value = savedSubdivision;
        metronome.subdivision = Number(savedSubdivision);
    }

    // Update beat dots based on time signature and subdivision
    function updateBeatDots(count) {
        beatDotsContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'unique-beat-dot';
            beatDotsContainer.appendChild(dot);
        }
    }

    function updateGnomePosition() {
        const leftWidth = document.querySelector('.unique-left').offsetWidth;
        const rightWidth = document.querySelector('.unique-right').offsetWidth;
        const totalWidth = leftWidth + rightWidth;

        // Center the gnome container relative to its parent
        gnomeContainer.style.left = `calc(50% - ${gnomeContainer.offsetWidth / 2}px)`;
    }

    updateBeatDots(metronome.beatsPerMeasure * metronome.subdivision);

    // Toggle dark/light theme
    function toggleTheme() {
        document.body.classList.toggle("light-theme");
        const isLightTheme = document.body.classList.contains("light-theme");
        toggleThemeBtn.textContent = isLightTheme ? "Dark Mode" : "Light Mode";
        localStorage.setItem("theme", isLightTheme ? "light" : "dark");
        // Update dot colors based on theme
        const dots = document.querySelectorAll('.unique-beat-dot');
        dots.forEach(dot => {
            dot.style.backgroundColor = isLightTheme ? "#000000" : "hsl(0 0% 90%)";
        });
    }

    toggleThemeBtn.addEventListener("click", toggleTheme);

    // Set default theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        toggleThemeBtn.textContent = "Dark Mode";
        // Set initial dot color for light theme
        const dots = document.querySelectorAll('.unique-beat-dot');
        dots.forEach(dot => {
            dot.style.backgroundColor = "#000000";
        });
    } else {
        toggleThemeBtn.textContent = "Light Mode";
        // Set initial dot color for dark theme
        const dots = document.querySelectorAll('.unique-beat-dot');
        dots.forEach(dot => {
            dot.style.backgroundColor = "hsl(0 0% 90%)";
        });
    }

    updateGnomePosition();
});
