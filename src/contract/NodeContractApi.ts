import { IDO_ADDR_CONT } from "./config";
import { USDT_ADDR } from "./coinConfig";
import { useAppStore } from "@store/index";
import { toRaw } from "vue";
import i18n from "@/locales/i18n";
import router from "@/router";
import { ethers } from "ethers";
import { Toast } from 'vant';
import { bpDiv, bpMul } from '@/utils/bpMath';
import { resolve } from "mathjs";
const $t = i18n.global.t;


type n = number | string;

export default class {
  public nodeObj;
  public defaultAccount;

  constructor() {
    this.createContract();
  }

  /**
   * 构建合约对象
   */
  async createContract() {
    const appStore = useAppStore();
    this.defaultAccount = appStore.defaultAccount;
    const { ethers, signerValue } = appStore.ethersObj;
    const signer = toRaw(signerValue);

    try {
      this.nodeObj = new ethers.Contract(
        IDO_ADDR_CONT.address,
        IDO_ADDR_CONT.abi,
        signer
      );
      console.log(toRaw(this.nodeObj), "合约对象");
    } catch (error) {
      console.log("node contract...构建合约对象失败", error);
    }
  }

  /**
   * 查看ido列表
   * @type {number} 0|1|2  待开启 进行中 已结束
   * @returns 
   */
  async getAllIdoList(type) {
    const { tokens, names, infos, idos } = await this.nodeObj.getIdoInfoBathch(type).catch((err) => console.log("获取ido列表失败", err));
    const data = await this.nodeObj.getIdoInfoBathch(type).catch((err) => console.log("获取ido列表失败", err));
    console.log(data, "rawdata");

    const list = tokens.map((item, index) => {
      return {
        ido: idos[index],
        token: tokens[index],
        name: names[index],
        mode: +infos[index][0], // 模式
        target: +infos[index][2], // 目标额度
        price: ethers.utils.formatUnits(infos[index][3], 5), // 当前价格  除以100000 单位U
        privateTime: +infos[index][4], //私募时间
        publicTime: +infos[index][5],  //公开轮时间
        endTime: +infos[index][6],  //结束时间
        releaseTime: +infos[index][7], //释放时间
        progress: +infos[index][1] === 0 ? 0 : bpMul(bpDiv(infos[index][1], infos[index][2]), 100)
      }
    });
    console.log("ido列表", list);
    return list
  }

  /**
   * 创建IDO  创建ido所需要的参数
   * @returns 
   */
  async createIDO(obj) {
    console.log("创建ido参数", obj);
    const price = bpMul(obj.idoPrice, 100000);
    const mode = +obj.roundType;
    let wHolder, tokens, times, quotas;
    if (obj.roundType === 0) { //白名单
      wHolder = obj.whiteType ? true : false;
      tokens = [obj.idoAddress, USDT_ADDR, obj.whiteType ? obj.whiteAdress : "0x0000000000000000000000000000000000000000"];
      quotas = [+obj.idoCount, +obj.whiteLimit, 0];
      times = [obj.whiteStartTime, 0, obj.whiteEndTime, obj.whiteReleaseTime];
    } else if (obj.roundType === 1) { //公售
      wHolder = false;
      // 0x0000000000000000000000000000000000000000 黑洞地址
      tokens = [obj.idoAddress, USDT_ADDR, "0x0000000000000000000000000000000000000000"];
      quotas = [+obj.idoCount, 0, +obj.publicLimit]; // 目标额度  白名单额度 公售额度 
      times = [0, obj.publicStartTime, obj.publicEndTime, obj.releaseTime];  // 白名单时间  公售时间  结束时间  释放时间
    } else if (obj.roundType === 2) {//公售加白名单
      wHolder = obj.whiteType ? true : false;
      tokens = [obj.idoAddress, USDT_ADDR, obj.whiteAdress ? obj.whiteAdress : "0x0000000000000000000000000000000000000000"];
      quotas = [+obj.idoCount, +obj.whiteLimit, +obj.publicLimit];
      times = [obj.whiteStartTime, obj.publicStartTime, obj.publicEndTime, obj.releaseTime];
    }

    return new Promise(async (resolve, reject) => {
      await this.nodeObj.createIdo(price, mode, wHolder, tokens, quotas, times, {
        // gasPrice: 200 * 10 ** 9 + baseGasPrice,
        // gasLimit: 3000000
      }).then(async (res) => {
        console.log(res);
        await res?.wait?.();
        resolve(true)
      }).catch((error) => {
        console.error(error);
        Toast.fail('error');
        reject(true)
      });
    })
  }

  /**
   * 获取ido详情
   * @returns 
   */
  async getIdoInfo(adress, account) {
    const rawData = await this.nodeObj.getIdoInfo(adress, account).catch((err) => console.log("获取dao详情失败", err));
    console.log(rawData, "-----------rawData");

    // console.log(await this.nodeObj.decimals(), "-------decimals");
    const { quotas, idoToken, info, name, isW, totalSupply, userData } = await this.nodeObj.getIdoInfo(adress, account).catch((err) => console.log("获取dao详情失败", err));
    const data = {
      address: idoToken,
      name: name,
      totalSupply: +totalSupply,
      isWhite: isW,//是否白名单
      mode: +quotas[0], // 0 1 2  白 公募 白+公募
      blance: +userData[0], //剩余额度
      coinCount: +userData[1], //兑换额度
      stayGetCount: +userData[2], //待领取
      GetCount: +userData[3], //已领取
      whiteBlance: +info[1], //白名单额度
      publicBlance: +info[2],  //公售额度
      whiteTime: +info[3],  //白名单时间
      publicTime: +info[4],  //公售时间
      endTime: +info[5],  //结束时间
      releaseTime: +info[6],  //释放时间
      // totalCompare: +quotas[1] === 0 ? 0 : +quotas[1] / +quotas[2] //总量
      totalCompare: bpMul(bpDiv(quotas[1], quotas[2]), 100) //总量
    }
    console.log("formatData", data)
    return data
  }

  async deleteIdo(coinAddress) {
    await this.nodeObj.deleteIdo(coinAddress).then(async (res) => {
      await res?.wait?.();
      Toast($t('msg.40'));
    })
  }


  // 后面的都没有使用

  /**
   * 查看dao列表
   * @type {number} 0|1|2  待开启 进行中 已结束
   * @returns 
   */
  async getAllDaoList(type) {
    const { tokens, names, infos } = await this.nodeObj.getIdoInfoBathch(type).catch((err) => console.log("获取dao列表失败", err));
    const list = tokens.map((item, index) => {
      return {
        token: tokens[index],
        name: names[index],
        mode: +infos[index][0], // 模式
        startTime: +infos[index][4], //私募时间
        publicTime: +infos[index][5],  //公开轮时间
        endTime: +infos[index][6],  //结束时间
        releaseTime: +infos[index][7], //释放时间
        joinCount: 999
      }
    });
    console.log("dao列表", list);
    return list
  }

  /**
 * 查看tigerDao列表
 * @type {number} 0|1|2  待开启 进行中 已结束
 * @returns 
 */
  async getAllTigerDaoList(type) {
    const { tokens, names, infos } = await this.nodeObj.getIdoInfoBathch(type).catch((err) => console.log("获取tigerDa列表失败", err));
    const list = tokens.map((item, index) => {
      return {
        token: tokens[index],
        name: names[index],
        APR: "20%", //年化
        count: 100,//额度
        targetCount: 1000, //总额度
        mode: +infos[index][0], // 模式
        price: ethers.utils.formatUnits(infos[index][3], 5), // 当前价格  除以100000 单位U
        startTime: +infos[index][4], //开始时间
        endTime: +infos[index][6],  //结束时间
        releaseTime: +infos[index][7], //释放时间
        progress: +infos[index][1] === 0 ? 0 : infos[index][1].div(infos[index][2]) //进度
      }
    });
    console.log("tigerDa列表", list);
    return list
  }


  /**
* 查看farm列表
* @type {number} 0|1|2  待开启 进行中 已结束
* @returns 
*/
  async getAllfarmList(type) {
    const { tokens, names, infos } = await this.nodeObj.getIdoInfoBathch(type).catch((err) => console.log("获取tigerDa列表失败", err));
    const list = tokens.map((item, index) => {
      return {
        token: tokens[index],
        name: names[index],
        APR: "20%", //年化
        count: 100,//总产量
        pledgeCoin: "HT", //质押代币
        outPutCoin: "BNB", // 产出代币
        startTime: +infos[index][4], //开始时间
        endTime: +infos[index][6],  //结束时间
        releaseTime: +infos[index][7], //释放时间
      }
    });
    console.log("farm列表", list);
    return list
  }


}
