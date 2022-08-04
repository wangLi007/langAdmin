// 代币 对象信息

// import { useAppStore } from '@store/appStore';
import { ethers } from 'ethers';
import { useAppStore } from '@/store/index';
import { toRaw } from 'vue';
import { Toast, Button } from 'vant';
import i18n from '@/locales/i18n';
import { resolve } from 'mathjs';
const $t = i18n.global.t;

export default class {
  public coinObj; // 代币合约对象
  public decimals; // 精度
  public balance; // 余额
  public defaultAccount; // 用户钱包地址

  /**
   * 构建
   * @param {Object} addressObj 包括合约地址、abi
   */
  constructor(addressObj) {
    const appStore = useAppStore();
    const account = appStore.defaultAccount;
    this.craeteCoinToken(addressObj);
    this.defaultAccount = account;
  }

  /**
   * 构建代币对象
   * @param {Object} addressObj：包括合约地址、abi
   * 例如 去旁边的 address.js 里拿 BVG_TOKEN_CONT 传入
   * @returns 代币的信息
   */
  craeteCoinToken(addressObj) {
    const appStore = useAppStore();
    const { ethers, signerValue } = appStore.ethersObj;
    const coinObj = new ethers.Contract(addressObj.address, addressObj.abi, toRaw(signerValue));
    this.coinObj = coinObj;
    return this.coinObj;
  }

  /**
   * 获取该代币精度
   * @returns {Number} 精度
   */
  async getDecimals() {
    this.decimals = await this.coinObj.decimals();
    return this.decimals;
  }

  /**
   * 获取代币余额（带精度）
   * @returns {Number} 余额
   */
  async getOriginBalan() {
    let tempBalan = await this.coinObj.balanceOf(this.defaultAccount).catch((err) => err);
    tempBalan = +tempBalan ? tempBalan : 0;
    tempBalan = String(tempBalan);
    return tempBalan;
  }

  /**
   * 判断是否授权
   * @param {String} contractAddr 合约地址
   * @returns {Boolean} true 已经授权，false 没有授权
   */
  async allow(contractAddr) {
    let hasAllowance = await this.coinObj.allowance(this.defaultAccount, contractAddr);
    const originBalan = await this.getOriginBalan();
    return Number(hasAllowance) > Number(originBalan);
  }

  /**
   * 授权
   * @param {String} contractAddr 合约地址
   */
  async auth(contractAddr) {
    return new Promise((resolve, reject) => {
      Toast.success($t('msg.31'))
      this.coinObj
        .approve(contractAddr, ethers.constants.MaxUint256)
        .then(async (resp) => {
          console.log(resp, "resprespresp");
          Toast.loading({
            message: $t('msg.29'),
            forbidClick: true,
          });
          const result = await resp?.wait()
          console.log(result);
          Toast.success($t('msg.3'))
          return resolve(true);
        })
        .catch(err => {
          console.log(err);
          return reject(false);
        });
    })
  }
}
