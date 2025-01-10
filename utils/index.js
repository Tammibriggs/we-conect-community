const hasWindow = () => {
  return typeof window === "object";
};

// describe data as minutes, hours, days, months and years
const dateDifference = (date) => {
  const currentDate = new Date();
  const diffInMilliseconds = currentDate.valueOf() - new Date(date).valueOf();

  const minutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? "s" : ""}`;
  } else if (hours < 24) {
    return `${hours} hr${hours !== 1 ? "s" : ""}`;
  } else if (days < 30) {
    return `${days} day${days !== 1 ? "s" : ""}`;
  } else if (months < 12) {
    return `${months} mth${months !== 1 ? "s" : ""}`;
  } else {
    return `${years} yr${years !== 1 ? "s" : ""}`;
  }
};

const convertKbToMb = (kilobyte, rounded = false) => {
  const inMb = kilobyte / 1024;
  switch (rounded) {
    case true:
      return Math.round(inMb);
    default:
      return inMb;
  }
};

const formatNumber = (value) => {
  return Intl.NumberFormat("en", {
    notation: "compact",
  }).format(value);
};

export { hasWindow, dateDifference, convertKbToMb, formatNumber };
