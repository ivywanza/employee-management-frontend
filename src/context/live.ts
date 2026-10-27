import { createContext, useContext } from "react";

export interface ChatMessage {
  id: string;
  kind: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string | null;
  title: string | null;
  content: string;
  created_at: string;
  read_at: string | null;
}


export interface LiveNotification {
  type: "notification";
  title: string;
  message: string;
  target?: string;
}

export type LiveEvent =
  | {
      type: "broadcast" | "direct" | "room";
      message: ChatMessage;
    }
  | LiveNotification;


export type LiveStatus = "connecting" | "open" | "closed";
export type LiveHandler = (event: LiveEvent) => void;

export interface LiveContextType {
  status: LiveStatus;
  subscribe: (handler: LiveHandler) => () => void;
}

export const LiveContext = createContext<LiveContextType | undefined>(undefined);

export function useLive() {
  const context = useContext(LiveContext);
  if (!context) throw new Error("useLive must be used within a LiveProvider");
  return context;
}