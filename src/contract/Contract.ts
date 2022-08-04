// 代币 对象信息

// import { useAppStore } from '@store/appStore';
import { ethers, BigNumber } from 'ethers';
import { useAppStore } from '@/store/index';
import { toRaw } from 'vue';
import { Toast, Button } from 'vant';
import i18n from '@/locales/i18n';
import { bpFormat, bpDiv, bpMul } from '@/utils/bpMath'
import { STI_ADDR } from './coinConfig'

const $t = i18n.global.t;

export default class {
  public contractObj; // 代币合约对象
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
   * @returns 代币的信息
   */
  craeteCoinToken(addressObj) {
    const appStore = useAppStore();
    const { ethers, signerValue } = appStore.ethersObj;
    const contractObj = new ethers.Contract(addressObj.address, addressObj.abi, toRaw(signerValue));
    this.contractObj = contractObj;
    return this.contractObj;
  }


  // -------下面的方法是IDO合约用到的

  /**
 * 抢购
 * @param amount 购买u的数量
 * @param decimal 购买u的数量
 */
  async purchase(amount, decimal = 18) {
    return new Promise((resolve, reject) => {
      this.contractObj.purchase(ethers.utils.parseUnits(amount, decimal)).then(async (res) => {
        Toast.loading({
          message: $t('msg.28'),
          forbidClick: true,
        });
        await res?.wait()
        resolve(true)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }

  /**
   * 提取代币
   */
  async withdraw() {
    return new Promise((resolve, reject) => {
      this.contractObj.withdraw().then(async (res) => {
        await res?.wait()
        Toast.success($t('msg.19'))
        resolve(true)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }

  //----下面的方法是Farm合约用到的
  /**
   * 获取农场列表
   * @returns promise
   */
  async getPoolInfoBatch(type) {
    return new Promise((resolve, reject) => {
      this.contractObj.getPoolInfoBatch(+type).then(async (data) => {
        const { names, infos } = data
        console.log(data, "rawData");
        const list = names.map((item, index) => {
          return {
            name: names[index][0],
            pledgeCoin: names[index][1],
            outPutCoin: names[index][2],
            id: +infos[index][0],
            count: +infos[index][1],
            startTime: +infos[index][2],
            endTime: +infos[index][3]
          }
        })
        resolve(list)
      }).catch((error) => {
        console.log(error);
        reject(error)
      });
    })
  }

  /**
   * 获取农场详情
   * @param pid 农场pid
   * @param address 用户钱包地址
   * @returns 
   */
  async viewInfo(pid) {
    return new Promise((resolve, reject) => {
      this.contractObj.viewInfo(+pid, this.defaultAccount).then(async (res) => {
        const { names, decimlas, addrInfos, infos, uInfos } = res
        console.log(res, "rawData");
        const data = {
          name: names[0],
          pledgeCoin: names[1],
          outPutCoin: names[2],
          totalCount: infos[0],
          pledgeCoinAddr: addrInfos[0],
          outPutCoinAddr: addrInfos[1],
          referral: addrInfos[2],
          count: bpFormat(uInfos[0], 4, +decimlas[0]),
          startTime: +infos[1],
          endTime: +infos[2],
          releaseStart: +infos[3],
          releaseEnd: +infos[4],
          pledgeCount: +uInfos[0],// 质押数量
          peddingCount: bpFormat(uInfos[1], 4, +decimlas[1]),
          receivedCount: bpFormat(uInfos[2], 4, +decimlas[1]),
          peddingAward: bpFormat(uInfos[3], 4, +decimlas[1]),
          receivedAward: bpFormat(uInfos[4], 4, +decimlas[1]),
          rewardRatio: bpDiv(infos[5], 100), //奖励比例
          pledgeCoinDecimlas: +decimlas[0],
          outPutCoinDecimlas: +decimlas[1],
        }

        resolve(data)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }
  // pow

  /**
   * 
   * @param pid 
   * @param amount 
   * @param { number} power  多少次幂
   * @param { string } 推荐人地址 默认0x0000000000000000000000000000000000000000
   * @returns 是否质押成功
   */
  stake(pid, amount, power, referralAddr = "0x0000000000000000000000000000000000000000") {
    console.log(referralAddr, "referralAddr");

    if (!referralAddr) referralAddr = "0x0000000000000000000000000000000000000000"
    return new Promise((resolve, reject) => {
      this.contractObj.stake(+pid, ethers.utils.parseUnits(amount, power), referralAddr).then(async (res) => {
        await res?.wait()
        resolve(true)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }


  //解除质押
  unStake(pid) {
    return new Promise((resolve, reject) => {
      this.contractObj.unStake(+pid).then(async (res) => {
        await res?.wait()
        resolve(true)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }

  //领取收益
  claimReward(pid) {
    return new Promise((resolve, reject) => {
      this.contractObj.claimReward(+pid).then(async (res) => {
        await res?.wait()
        resolve(true)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }


  /**
   * 创建矿池
   * @param obj 
   */
  addPool(obj) {
    const isRelease = Number(obj.releaseType) === 1;
    const times = [obj.startTime, obj.endTime, isRelease ? obj.releaseStartTime : 0, isRelease ? obj.releaseEndTime : 0]
    const tokens = [obj.pledgeCoinAddr, obj.outPutCoinAddr];
    const maxOut = obj.totalCount;
    const invRate = obj.rewardRatio;
    return new Promise((resolve, reject) => {
      this.contractObj.addPool(times, tokens, maxOut, invRate).then(async (res) => {
        await res?.wait()
        resolve(true)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }


  /**
   * 获取矿池数量
   */
  getPoolLength() {
    return new Promise((resolve, reject) => {
      this.contractObj.poolLength().then(async (res) => {
        resolve(+res)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }

  //----------下面的是Tigerdao合约封装的接口

  /**
   * 获取TigerDao列表
   */
  getTigerDaoList(type) {
    return new Promise((resolve, reject) => {
      this.contractObj.getTigerDaoInfoBatch(type).then((res) => {
        console.log(res, "rawData");
        const { daos, tokens, names, infos } = res
        const list = tokens.map((item, index) => {
          return {
            dao: daos[index],
            token: tokens[index],
            name: names[index],
            target: +infos[index][1], // 目标额度
            everyTarget: +infos[index][6],
            price: Number(ethers.utils.formatUnits(infos[index][2], 5)).toFixed(5), // 当前价格  除以100000 单位U
            startTime: +infos[index][3],
            endTime: +infos[index][4],
            progress: +infos[index][0] === 0 ? 0 : bpMul(bpDiv(infos[index][0], infos[index][1]), 100)
          }
        });
        console.log(list, "listlist");

        resolve(list)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }

  /**
   * 获取tiger dao详情
   * @param address 创建出来 Tigerdao的代币地址
   * @returns 
   */
  getTigerDaoInfo(address) {
    return new Promise((resolve, reject) => {
      this.contractObj.getTigerDaoInfo(address, useAppStore().defaultAccount).then(async (res) => {
        console.log(res, "rawData");

        const { daoToken, infos, totalSupply, name, userData } = res
        const data = {
          address: daoToken,
          name: name,
          totalSupply: +totalSupply,
          everyAmout: +infos[0],
          price: +infos[1],
          release: +infos[2],
          startTime: +infos[3],
          endTime: +infos[4],
          BoughtAmout: +infos[5],
          targetAmount: +infos[6],
          nextRelease: +userData[0],
          leftAmout: +userData[1],
          redeemAmout: +userData[2],
          peddingGet: +userData[3],
          GetAmout: +userData[4],
          totalCompare: bpMul(bpDiv(infos[5], infos[6]), 100) //总量
        }

        resolve(data)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }

  /**
   * 创建tigerdao
   * @param {Object} obj  表单对象
   */
  createTigerDao(obj) {
    const quotas = [bpMul(obj.price, 100000), obj.totalAmout, obj.everyAmout];
    const tokens = [obj.address, STI_ADDR];
    const times = [obj.startTime, obj.endTime, obj.releaseCycle];
    return new Promise((resolve, reject) => {
      this.contractObj.createTigerDao(quotas, tokens, times).then(async (res) => {
        await res?.wait()
        resolve(+res)
      }).catch((error) => {
        console.error(error);
        reject(error)
      });
    })
  }
}
