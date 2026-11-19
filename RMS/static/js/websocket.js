/**
 * RESTO DADDY - Real-time WebSocket Client & Audio Synthesizer
 * Ensures zero-lag synchronization across POS, KDS, Waiter App, Customer QR, and Admin Suite.
 */

class RestoWebSocket {
    constructor() {
        this.socket = null;
        this.reconnectInterval = 2500;
        this.audioContext = null;
        this.soundEnabled = true;
        this.init();
    }

    init() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        try {
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log("⚡ RESTO DADDY WebSocket Connected");
                window.dispatchEvent(new CustomEvent('ws:connection_change', { detail: { status: 'connected' } }));
            };

            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (e) {
                    console.error("Failed to parse websocket message", e);
                }
            };

            this.socket.onclose = () => {
                console.warn("⚠️ WebSocket closed, reconnecting in 2.5s...");
                window.dispatchEvent(new CustomEvent('ws:connection_change', { detail: { status: 'disconnected' } }));
                setTimeout(() => this.init(), this.reconnectInterval);
            };

            this.socket.onerror = (err) => {
                console.error("WebSocket encountered error:", err);
            };
        } catch (e) {
            console.warn("Could not connect WebSocket:", e);
            setTimeout(() => this.init(), this.reconnectInterval);
        }
    }

    handleMessage(msg) {
        const { event, data } = msg;
        console.log(`📡 WebSocket Event: [${event}]`, data);

        // Sound chime for incoming order or status change
        if (event === 'order_created' && this.soundEnabled) {
            this.playOrderChime();
        }

        // Dispatch browser custom event
        window.dispatchEvent(new CustomEvent(`ws:${event}`, { detail: data }));
    }

    playOrderChime() {
        try {
            if (!this.audioContext) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioCtx();
            }
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // Two-tone pleasant kitchen notification chime (880Hz then 1320Hz)
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now); // A5

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1320, now + 0.12); // E6

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start(now);
            osc1.stop(now + 0.12);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.65);
        } catch (e) {
            console.warn("Audio chime prevented or unsupported:", e);
        }
    }

    toggleSound(enable) {
        this.soundEnabled = enable;
    }
}

window.restoWS = new RestoWebSocket();
