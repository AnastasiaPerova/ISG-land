const WORK_START_HOUR = 8;
const WORK_END_HOUR = 16;
const CHECK_INTERVAL_MS = 60 * 1000;

function isWorkingTime(date) {
  const day = date.getDay();
  const minutesFromMidnight = date.getHours() * 60 + date.getMinutes();
  const startMinutes = WORK_START_HOUR * 60;
  const endMinutes = WORK_END_HOUR * 60;

  return day >= 1 && day <= 5 && minutesFromMidnight >= startMinutes && minutesFromMidnight < endMinutes;
}

export function initHeaderContactStatus(root = document) {
  const dots = Array.from(root.querySelectorAll(".isg-header-contact__dot"));
  if (!dots.length) {
    return () => {};
  }

  const update = () => {
    const active = isWorkingTime(new Date());
    dots.forEach((dot) => {
      dot.classList.toggle("isg-header-contact__dot--offline", !active);
    });
  };

  update();
  const timerId = window.setInterval(update, CHECK_INTERVAL_MS);

  return () => {
    window.clearInterval(timerId);
  };
}
