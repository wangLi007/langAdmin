<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import langList from './index.json';
import { watch } from 'fs';

const tableData = ref([
  {
    key: 'home',
    cn: '中文',
    kn: '게임파이 월드',
    en: 'English',
    isEdit: false,
  },
]);

const handleEdit = (index, item) => {
  tableData.value[index].isEdit = !tableData.value[index].isEdit;
};

// axios({
//   url: './index.json',
//   method: 'GET',
//   responseType: 'json',
// }).then(res => {
//   console.log(res);
// });

console.log('langList', langList);

// watch(()=>{},)

function handleSave(){
  saveJSON(tableData.value, 'lang.json');
}

function handleImport(){
  
}

function saveJSON(data, filename) {
  if (!data) {
    alert('保存的数据为空');
    return;
  }
  if (!filename) filename = 'json.json';
  if (typeof data === 'object') {
    data = JSON.stringify(data, undefined, 4);
  }
  var blob = new Blob([data], { type: 'text/json' }),
    e = document.createEvent('MouseEvents'),
    a = document.createElement('a');
  a.download = filename;
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
  e.initMouseEvent(
    'click',
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );
  a.dispatchEvent(e);
}
</script>

<template>
  <div class="page-wrap">
    <div class="header-wrap">
      <h1>多语言管理后台</h1>
      <div class="btn-group">
        <el-button type="primary" @click="handleImport">导入文件(json)</el-button>
        <el-button type="primary" @click="handleSave">导出文件(json)</el-button>
      </div>
    </div>
    <el-table :data="tableData" height="auto" style="width: 100%">
      <el-table-column>
        <template v-slot:header>key</template>
        <template v-slot="scoped">
          <el-form-item prop="key">
            <el-input v-if="scoped.row.isEdit" v-model="scoped.row.key"></el-input>
            <span v-else>{{ scoped.row.key }}</span>
          </el-form-item>
        </template>
      </el-table-column>

      <el-table-column>
        <template v-slot:header>英文</template>
        <template v-slot="scoped">
          <el-form-item prop="en">
            <el-input v-if="scoped.row.isEdit" v-model="scoped.row.en"></el-input>
            <span v-else>{{ scoped.row.en }}</span>
          </el-form-item>
        </template>
      </el-table-column>

      <el-table-column>
        <template v-slot:header>中文</template>
        <template v-slot="scoped">
          <el-form-item prop="cn">
            <el-input v-if="scoped.row.isEdit" v-model="scoped.row.cn"></el-input>
            <span v-else>{{ scoped.row.cn }}</span>
          </el-form-item>
        </template>
      </el-table-column>

      <el-table-column>
        <template v-slot:header>韩文</template>
        <template v-slot="scoped">
          <el-form-item prop="kn">
            <el-input v-if="scoped.row.isEdit" v-model="scoped.row.kn"></el-input>
            <span v-else>{{ scoped.row.kn }}</span>
          </el-form-item>
        </template>
      </el-table-column>

      <el-table-column label="Operations">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.$index, scope.row)">Edit</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
.page-wrap {
  padding: 30px 50px;
  .header-wrap {
    display: flex;
    .btn-group {
      margin-left: 50px;
    }
  }
}
</style>
