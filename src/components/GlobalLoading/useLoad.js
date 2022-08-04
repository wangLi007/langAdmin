import { reactive, readonly } from '@vue/reactivity';

const state = reactive({
  loading: false,
});

const loadStore = readonly(state);

/**
 * 控制loading显示隐藏
 * @param {Boolean} payload 控制loading显示隐藏
 */
function setLoad(payload) {
  state.loading = payload;
}

export { loadStore, setLoad };
