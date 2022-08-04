<!-- 顶部栏 -->
<script setup lang="ts">
  import { useAppStore } from '@/store/index';
  import router from '@/router';
  import { getCurrentInstance, reactive, ref, watchEffect } from 'vue';
  import { useRoute } from 'vue-router';
  import { plusXing } from '@/utils/tools';
  const route = useRoute();
  const currentRoute: any = ref('ido'); // 当前路由的name
  watchEffect(() => {
    if (route.name) {
      currentRoute.value = route.name;
    }
  });

  const appStore = useAppStore();
  const gThis = getCurrentInstance().appContext.config.globalProperties;
  // 语言列表
  const langList = reactive([
    {
      id: 1,
      name: '中文',
      target: 'cn',
      active: false,
    },
    {
      id: 2,
      name: 'English',
      target: 'en',
      active: true,
    },
  ]);

  langList.forEach((item) => {
    item.active = item.target === appStore.curLang;
  });

  /**
   * 选择语言
   */
  function pickLang(lang) {
    console.log('lang..', lang);
    gThis.$i18n.locale = lang.target;

    appStore.setLang(lang.target);

    langList.forEach((item) => {
      item.active = lang.id === item.id;
    });
  }

</script>

<template>
  <div class="header">
    <div class="top-bar">
      <!-- <img src="@img/logo.png" alt="logo" class="logo" @click="router.push({ name: 'ido' })" /> -->
      <div class="utils">
        <div class="blance" v-if="!appStore.defaultAccount" @click="appStore.linkWallet">
          {{ $t('header.1') }}
        </div>
        <div class="blance" v-else>{{ plusXing(appStore.defaultAccount, 4, 4) }}</div>
        <div class="lang-wrap" @click="appStore.setIsShowLangPanel(!appStore.isShowLangPanel)">
          <div style="display: flex">
            <div
              class="current"
              :style="{
                visibility: !appStore.isShowLangPanel ? 'initial' : 'hidden',
              }"
            >
              {{ $t('header.2') }}
            </div>
          </div>
          <div class="panel" v-show="appStore.isShowLangPanel">
            <li class="lang-item" v-for="lang in langList" :key="lang.id" @click="pickLang(lang)">
              {{ lang.name }}
            </li>
          </div>
        </div>
      </div>
    </div>

    <!-- 一些工具操作 -->
    <ul class="nav">
      <li :class="{ active: currentRoute.includes('ido') }" @click="router.push({ name: 'ido' })">
        {{ $t('header.5') }}
      </li>
      <li :class="{ active: currentRoute.includes('dao') }" @click="router.push({ name: 'dao' })">
        {{ $t('header.4') }}
      </li>
      <li
        :class="{ active: currentRoute.includes('trigerDao') }"
        @click="router.push({ name: 'trigerDao' })"
      >
        {{ $t('header.6') }}
      </li>
      <li :class="{ active: currentRoute.includes('farm') }" @click="router.push({ name: 'farm' })">
        {{ $t('header.7') }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
  .header {
    color: #fff;
    font-weight: 400;
    font-size: 14px;

    .top-bar {
      max-height: 46px;
      @include flexPos(space-between);
      padding: 10px 20px;

      .utils {
        position: relative;
        @include flexPos(center);

        .blance {
          font-size: 12px;
          margin-right: 41px;
          font-weight: 400;
          line-height: 14px;
        }

        .lang-wrap {
          position: relative;

          .panel {
            position: absolute;
            top: 0;
            right: 0;
            padding-right: 10px;
            background-color: #1b0b42;

            li {
              padding-bottom: 5px;
            }
          }
        }
      }
    }

    .nav {
      padding: 13px 20px;
      font-weight: 400;
      color: #ffffff;
      @include flexPos(space-between);
      background-color: #0b0223;

      li {
        color: #5f547b;
        line-height: 16px;

        &.active {
          color: #efb611;
        }
      }
    }
  }
</style>
