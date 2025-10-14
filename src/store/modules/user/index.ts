import { defineStore } from 'pinia';
import { getUserInfo } from '@/api';
import { UserState } from './types';

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    data: null,
  }),
  actions: {
    async getUserInfo() {
      const res = await getUserInfo();
      this.data = res.data;
    },
  },
});

export default useUserStore;
