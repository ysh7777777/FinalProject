document.addEventListener("DOMContentLoaded", () => {
    const carouselElement = document.querySelector("#heroCarousel");

    if (!carouselElement || typeof bootstrap === "undefined") {
        return;
    }

    bootstrap.Carousel.getOrCreateInstance(carouselElement, {
        interval: 5000,
        pause: "hover",
        ride: "carousel",
        touch: true,
        wrap: true
    });
});