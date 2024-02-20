import { AppInfo } from "@/client";
import AppInfoService from "@/service/AppInfo";
import { message } from "antd";
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useEffect,
  useState,
} from "react";

export const AppInfoContext = createContext<{
  appInfo?: AppInfo;
  setAppInfo: Dispatch<SetStateAction<AppInfo | undefined>>;
}>({
  appInfo: undefined,
  setAppInfo: () => {},
});

export const AppInfoProvider = ({ children }: PropsWithChildren) => {
  const [appInfo, setAppInfo] = useState<AppInfo>();

  useEffect(() => {
    AppInfoService.getAppInfo()
      .then(setAppInfo)
      .catch(() => message.error("Failed to get app info"));
  }, []);

  return (
    <AppInfoContext.Provider value={{ appInfo, setAppInfo }}>
      {children}
    </AppInfoContext.Provider>
  );
};
