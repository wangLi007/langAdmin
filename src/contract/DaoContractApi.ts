import { DAO_ADDR_CONT } from "./config";
import { USDT_ADDR } from "./coinConfig";
import { useAppStore } from "@store/index";
import { toRaw } from "vue";
import i18n from "@/locales/i18n";
import router from "@/router";
import { ethers } from "ethers";
import { Toast } from 'vant';
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
        DAO_ADDR_CONT.address,
        DAO_ADDR_CONT.abi,
        signer
      );
      console.log(toRaw(this.nodeObj), "合约对象");
    } catch (error) {
      console.log("node contract...构建合约对象失败", error);
    }
  }

  /**
   * 
   * @param type {number} 0|1|2  待开启 进行中 已结束
   * @returns 
   */
  async getAllDaoList(type) {
    const { infos, logos } = await this.nodeObj.getProposalInfoBatch(type).catch((err) => console.log("获取dao列表失败", err));

    const list = logos.map((item, index) => {
      return {
        url: logos[index],
        pid: infos[index][0],
        startTime: infos[index][1],
        endTime: infos[index][2],
        voteAmount: infos[index][3],
      }
    })
    console.log("list", list);
    return list
  }

  /**
   * 
   * @param obj 表单数据
   */
  async createProposal(obj) {
    const mode = obj.mode;
    const startTime = obj.startTime;
    const endTime = obj.endTime;
    const logo = obj.img;
    const description = obj.desc;
    const options = obj.options;
    return new Promise(async (resolve, reject) => {
      this.nodeObj.createProposal(mode, startTime, endTime, logo, description, options)
      .then(async (res) => {
        await res?.wait?.();
        resolve(true)
      }).catch((error) => {
        console.error(error);
        reject(false)
      });

    })
  }


  /**
   * 
   * @param {number} pid dao-pid
   * @returns {object} 
   */
  async getDAOInfo(pid) {
    const data = await this.nodeObj.viewInfo(pid, this.defaultAccount)
    console.log("rawData", data);
    const { stages, infos, des, optinos, optDes } = data
    return {
      pid: pid,
      isTake: stages[0],
      mode: stages[1],
      startTime: +infos[0],
      endTime: +infos[1],
      total: +infos[2],
      voteAmount: +infos[3],
      weight: +infos[4],
      img: des[0],
      desc: des[1],
      options: optinos.map((item, index) => {
        return {
          count: +optinos[index],
          desc: optDes[index]
        }
      })
    }
  }


  /**
 * 投票
 * @param {number} pid dao-pid
 * @returns {object} 
 */
  async vote(pid, option) {
    return new Promise((resolve, reject) => {
      this.nodeObj.vote(pid, option).then(async (res) => {
        await res?.wait?.();
        Toast.success($t("msg.33"))
        resolve(true)
      }).catch((error) => {
        Toast.fail($t("msg.34"));
        resolve(false)
      });
    })


  }

}
