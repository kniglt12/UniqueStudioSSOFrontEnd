import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ArcoVue from '@arco-design/web-vue';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import router from './router';
import i18n from './locale';
import App from './App.vue';
// 手动导入，防止由于插件导致全局css顺序不同，使dev和build模式下样式不完全相同
import '@arco-design/web-vue/es/style/index.less';
import './styles/tailwind.css';

// 全量引入样式
// import '@arco-design/web-vue/dist/arco.css';
const pinia = createPinia();
const app = createApp(App);
app.use(ArcoVue, {});
app.use(ArcoVueIcon);
app.use(pinia);
app.use(router);
app.use(i18n);
app.mount('#app');
