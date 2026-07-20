import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
};

type NotificationsState = {
  items: NotificationItem[];
};

const initialState: NotificationsState = {
  items: [],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      const existing = state.items.find(item => item.id === action.payload.id);
      if (existing) {
        existing.title = action.payload.title;
        existing.body = action.payload.body;
        existing.createdAt = action.payload.createdAt;
        return;
      }
      state.items.unshift(action.payload);
    },
    clearNotifications: (state) => {
      state.items = [];
    },
  },
});

export const { addNotification, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;

