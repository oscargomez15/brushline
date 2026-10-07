export default function animateFaq(event) {
  const heading = event.currentTarget;
  const panel = heading.nextElementSibling;
  const opening = !heading.classList.contains("active");
  const currentHeight = panel.getBoundingClientRect().height;
  const currentOpacity = getComputedStyle(panel).opacity;
  panel.getAnimations().forEach(animation => animation.cancel());
  heading.classList.toggle("active", opening);
  heading.setAttribute("aria-expanded", String(opening));
  panel.style.display = "block";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    panel.style.display = opening ? "block" : "none";
    return;
  }
  const animation = panel.animate([
    { height: `${currentHeight}px`, opacity: currentHeight ? currentOpacity : 0 },
    { height: opening ? `${panel.scrollHeight}px` : "0px", opacity: opening ? 1 : 0 },
  ], { duration: opening ? 420 : 320, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
  animation.onfinish = () => {
    panel.style.display = opening ? "block" : "none";
    animation.cancel();
  };
}
