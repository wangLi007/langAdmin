<template>
  <!-- top-bar -->
  <router-view />
</template>

<script lang="ts">
  import TopBar from '@cps/TopBar.vue';
  import { useAppStore } from '@store/index';
  import { ref, nextTick } from 'vue';
  import i18n from '@/locales/i18n';
  // import { Toast } from 'vant';
  import { CHAIN_ID } from '@/contract/config';
  const $t = i18n.global.t;
  export default {
    name: 'App',
    components: {
      TopBar,
    },

    setup() {
      const appStore = useAppStore();

      // 监听钱包切换
      const update = ref(true);
      window.ethereum?.on('accountsChanged', async (accounts) => {
        console.log('钱包切换');

        appStore.setAccount(accounts[0]);

        // 更新所有组件
        update.value = !update;

        nextTick(() => {
          update.value = !update.value;
          appStore.linkWallet();
        });
      });

      window.ethereum?.on('chainChanged', async (chainId) => {
        if (+CHAIN_ID !== +chainId) {
          // Toast.fail($t('msg.24'));
        }
      });

      return {
        update,
      };
    },
  };
</script>
