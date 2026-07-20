(() => {
    const progressBar = document.getElementById("scrollProgressBar");
    if (!progressBar) return;

    const updateProgress = () => {
        const scrollTop = window.scrollY;
        const scrollHeight =
            document.documentElement.scrollHeight - window.innerHeight;

        const progress =
            scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

        progressBar.style.width = `${progress}%`;
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    if ("ResizeObserver" in window) {
        new ResizeObserver(updateProgress).observe(document.body);
    }

    updateProgress();
})();
