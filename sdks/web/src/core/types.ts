export type UserbubbleUser = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
};

export type WidgetPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export type WidgetTheme = "light" | "dark" | "auto";

export type UserbubbleWebConfig = {
  apiKey: string;
  baseUrl?: string;
  useDirectUrls?: boolean;
  debug?: boolean;
  position?: WidgetPosition;
  theme?: WidgetTheme;
  accentColor?: string;
  hideWidget?: boolean;
};

export type UserbubbleState = {
  isInitialized: boolean;
  isIdentified: boolean;
  isOpen: boolean;
  user: UserbubbleUser | null;
  organizationSlug: string | null;
  externalId: string | null;
};

export type IdentifyResponse = {
  success: boolean;
  organizationSlug: string;
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string | null;
  };
};

export type StateListener = () => void;
