const ONBOARDING_KEY = "taletogether-onboarding-seen";

export const hasSeenOnboarding = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ONBOARDING_KEY) === "yes";
};

export const markOnboardingSeen = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ONBOARDING_KEY, "yes");
};
