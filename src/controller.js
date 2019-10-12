import throttle from 'lodash/throttle';
import { clamp } from './utils';

export default class Controller {
    constructor(wf) {
        this.wf = wf;
        this.playTimer = null;
        this.wf.on('load', () => {
            this.clickInit();
            this.resizeInit();
            this.playInit();
        });
    }

    clickInit() {
        const {
            template: { canvas },
            events: { proxy },
        } = this.wf;
        proxy(canvas, ['click', 'contextmenu'], event => {
            const {
                currentTime,
                options: { perDuration, padding, container },
            } = this.wf;
            const gridNum = perDuration * 10 + padding * 2;
            const gridGap = canvas.width / gridNum;
            const left = clamp(event.pageX - container.offsetLeft - padding * gridGap, 0, Infinity);
            const beginTime = Math.floor(currentTime / perDuration) * 10;
            const time = clamp(left / gridGap / 10 + beginTime, beginTime, beginTime + perDuration);
            this.wf.emit(event.type, time, event);
        });
    }

    resizeInit() {
        const {
            template,
            drawer,
            events: { proxy },
        } = this.wf;
        const throttleResize = throttle(() => {
            template.update();
            drawer.update();
            this.wf.emit('resize');
        }, 500);
        proxy(window, ['resize', 'orientationchange'], () => {
            throttleResize();
        });
    }

    playInit() {
        const {
            drawer,
            options: { mediaElement },
        } = this.wf;
        if (!mediaElement) return;
        (function loop() {
            this.playTimer = requestAnimationFrame(() => {
                const playing = !!(
                    mediaElement.currentTime > 0 &&
                    !mediaElement.paused &&
                    !mediaElement.ended &&
                    mediaElement.readyState > 2
                );

                if (playing) {
                    drawer.update();
                    this.wf.emit('play', mediaElement.currentTime);
                }

                if (!this.wf.destroy) {
                    loop.call(this);
                }
            });
        }.call(this));
    }

    destroy() {
        cancelAnimationFrame(this.playTimer);
    }
}