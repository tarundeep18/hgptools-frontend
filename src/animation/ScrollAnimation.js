import ScrollReveal from "scrollreveal";

const sr = ScrollReveal({
  origin: "bottom",
  distance: "40px",
  duration: 800,
  delay: 100,
  easing: "ease-in-out",
  reset: true, // set true if you want re-animation on scroll up
});

export const reveal = (selector, options = {}) => {
  sr.reveal(selector, {
    ...options,
  });
};


export const revealStagger = (selector, options = {}) => {
  sr.reveal(selector, {
    origin: "bottom",
    interval: 120, // ⭐ this makes cards come one by one
    ...options,
  });
};