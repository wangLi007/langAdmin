import { defineStore, storeToRefs } from "pinia";
import { ethers } from "ethers";
import { Toast } from 'vant';
import i18n from "@/locales/i18n";
import { CHAIN_ID } from "@/contract/config";
import { toRaw } from "vue";
const $t = i18n.global.t;

const useAppStore = defineStore("app", {
  state: () => ({
    defaultAccount: "", //钱包账号
    lang: "", // 语言
    isShowLangPanel: false,
    ethersObj: {
      ethers,
      signerValue: null, // 这个导出的时候是 proxy，需要用vue的toRaw转一下signer
      provider: null, // 这个是代理
      // tips:
      // const appStore = useAppStore();
      // const { ethers, signerValue } = appStore.ethersObj;
      // const signer = toRaw(signerValue);
    },
    adminList: []
  }),

  actions: {
    /**
     * 连接小狐狸钱包
     */
    async linkWallet() {
      if (this.defaultAccount) {
        return true;
      }
      await this.setEthersObj();
      const { provider } = this.ethersObj;
      await provider
        ?.send("eth_requestAccounts", [])
        .then(async () => {
          const { chainId } = await provider.getNetwork();
          // console.log(chainId, "--------chainId");
          if (Number(chainId) === +CHAIN_ID) {
            Toast.success($t('msg.1'));
            await this.getDefaultAccount();
          } else {
            Toast.success($t('msg.24'))
            this.switch()
          }
        })
        .catch(() => {
          Toast.fail($t("msg.2"));
        });
    },

    /**
     * 设置钱包地址
     */
    async setAccount(account: string) {
      this.defaultAccount = account;
    },

    /**
     * 连接成功，如果当前chainId不是当前Dapp使用的，提示用户切换
     * @returns 
     */
    async switch() {
      let bscMainnet = {
        chainId: '0x61', rpcUrls: ['https://data-seed-prebsc-1-s3.binance.org:8545'], chainName: 'bsc - test', nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB', // 2-6 characters long
          decimals: 18,
        }
      };
      this.switchChain(bscMainnet);
    },

    // 如果用户没有bsc 添加bsc链
    async addChain(data) {
      try {
        const { provider } = this.ethersObj;
        await toRaw(provider).provider.request({
          method: 'wallet_addEthereumChain',
          params: [data],
        });

      } catch (addError) {
        console.log(addError)
      }
    },

    // 提交切换链的请求
    async switchChain(data) {
      try {
        let { chainId } = data;
        const { provider } = this.ethersObj;
        await toRaw(provider).provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        }).catch(switchError => {
          if (switchError.code === 4902) {
            this.addChain(data);
          }
        })
        this.addChain(data);
      } catch (err) {
        console.log(err);

      }

    },

    /**
     * 获取钱包地址
     * @returns {*} 钱包地址
     */
    async getDefaultAccount() {
      // 尝试从内存拿钱包
      if (this.defaultAccount) return;
      let account;
      try {
        const { signerValue } = this.ethersObj;
        const signer = toRaw(signerValue);
        // 尝试从链上拿钱包
        account = await signer.getAddress();
      } catch (err) {
        Toast.fail($t("msg.4"));
      }
      this.setAccount(account);
      return account;
    },
    // 获取当前合约对象gas
    async getGasPrice() {
      const { provider } = this.ethersObj;
      const baseGasPrice = await provider.getGasPrice();
      return +baseGasPrice;
    },
    getLimitGas() {
      const { provider } = this.ethersObj;
      debugger
      provider.estimateGas({}, (a, b) => {
        console.log(a, b, '--------');
      })
    },
    /**
     * 设置多语言
     */
    setLang(lang) { 
      this.lang = lang;
      window.localStorage.setItem("lang", lang);
    },

    /**
     * 控制是否显示语言栏面板
     */
    setIsShowUserPanel(payload) {
      this.isShowUserPanel = payload;
    },

    /**
     * 控制是否显示语言栏面板
     */
    setIsShowLangPanel(payload) {
      this.isShowLangPanel = payload;
    },

    /**
     * 获取当前使用的设备视口宽度
     */
    getCurDevice() {
      const clientWidth = window.innerWidth;
      if (clientWidth <= 750) {
        this.curDevice = "phone";
      } else if (clientWidth <= 1280 && clientWidth > 750) {
        this.curDevice = "pad";
      } else {
        this.curDevice = "pc";
      }
    },

    /**
     * 获取ethers api
     */
    async setEthersObj() {
      /**
       * 等待获取小狐狸插件钱包
       * @returns
       */
      function _waiting(): Promise<any> {
        const duration = 1000;
        return new Promise<void>((resolve, reject) => {
          let count = 0;
          const timer = setInterval(() => {
            if (window.ethereum) {
              resolve();
              clearInterval(timer);
            }
            count++;

            // 1秒内还获取不到小狐狸，则
            const sec = (1 * 1000) / duration;
            if (count > sec) {
              reject();
              clearInterval(timer);
            }
          }, duration);
        });
      }

      await _waiting().catch((err) => {
        Toast.fail($t("msg.17"));
      });

      let provider, signer;
      try {
        provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        signer = provider.getSigner();
      } catch (err) { }

      this.ethersObj = {
        ethers,
        provider,
        signerValue: signer,
      };
    },

  },

  getters: {
    // 获取当前语言: en、cn、kn
    curLang() {
      return this.lang || window.localStorage.getItem("lang") || "en";
    },
    isAdmin() {
      // 先把权限关掉
      return !this.adminList.includes(this.defaultAccount)
    }
  },
});

export { storeToRefs, useAppStore };
