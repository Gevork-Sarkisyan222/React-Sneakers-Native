// components/BlockedGuard.tsx
import React, { useLayoutEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { BlockedScreen } from "@/components/BlockedScreen";
import { UserInterface } from "@/constants/Types";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

export function BlockedGuard({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<UserInterface | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUserBlocked, setIsUserBlocked] = React.useState(false);

  const fetchCurrentUser = async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) throw new Error("Token not found");

      const { data } = await axios.get<UserInterface>(
        "https://dcc2e55f63f7f47b.mokky.dev/auth_me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCurrentUser(data);
      setIsUserBlocked(data.isBlocked);
    } catch (error) {
      setCurrentUser(null);
      setIsUserBlocked(false);
    } finally {
      setIsLoading(false);
    }
  };

  useLayoutEffect(() => {
    fetchCurrentUser();
  }, [isLoading]);

  if (isUserBlocked) {
    return (
      <BlockedScreen
        adminName={currentUser?.blockedBy ?? "Н/Д"}
        reason={currentUser?.blockReason ?? undefined}
        banUntil={currentUser?.banUntil ?? undefined}
      />
    );
  }

  return <>{children}</>;
}
