(() => {
    const progressBar = document.getElementById("scrollProgressBar");
    if (!progressBar) return;

    let ticking = false;

    const updateProgress = () => {
        const scrollTop = globalThis.scrollY;
        const scrollHeight = document.documentElement.scrollHeight - globalThis.innerHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        progressBar.style.width = `${progress}%`;
        ticking = false;
    };

    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(updateProgress);
            ticking = true;
        }
    };

    globalThis.addEventListener("scroll", onScroll, { passive: true });
    globalThis.addEventListener("resize", onScroll);

    if ("ResizeObserver" in window) {
        new ResizeObserver(onScroll).observe(document.body);
    }

    updateProgress();
})();