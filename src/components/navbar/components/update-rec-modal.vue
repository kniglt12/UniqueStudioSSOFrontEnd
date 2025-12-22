<template>
  <a-modal
    v-model:visible="visible"
    :title="$t('common.operation.updateRecruitment')"
    :on-before-ok="sendForm"
    draggable
  >
    <a-space direction="vertical" size="mini">
      <a-form ref="recruitmentForm" :model="formData" layout="vertical">
        <a-form-item field="select_recruitment" label="选择招新">
          <a-select
            v-model="selectedRid"
            placeholder="请选择要修改的招新"
            @change="onRecruitmentChange"
          >
            <a-option
              v-for="rec in recruitmentStore.data"
              :key="rec.uid"
              :value="rec.uid"
              :label="rec.name"
            >
              {{ rec.name }}
            </a-option>
          </a-select>
        </a-form-item>

        <a-form-item field="rec_name" :label="$t('common.createRec.recName')">
          <a-input
            v-model="formData.name"
            :placeholder="$t('common.createRec.inputRecName')"
          />
        </a-form-item>

        <a-form-item
          field="rec_time_range"
          :label="$t('common.createRec.recTimeRange')"
        >
          <a-range-picker
            v-model="timeRange1"
            show-time
            :time-picker-props="{ defaultValue: ['00:00:00', '00:00:00'] }"
            format="YYYY-MM-DD HH:mm"
            @ok="onOk1"
          />
        </a-form-item>

        <a-form-item field="deadline" label="报名结束时间">
          <a-date-picker
            v-model="deadline"
            show-time
            :time-picker-props="{ defaultValue: '00:00:00' }"
            format="YYYY-MM-DD HH:mm"
            @ok="onDeadlineChange"
          />
        </a-form-item>
      </a-form>
    </a-space>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { useI18n } from 'vue-i18n';
import useRecruitmentStore from '@/store/modules/recruitment';
import type { UpdateParams } from '@/store/modules/recruitment/types';

const { t } = useI18n();
const recruitmentStore = useRecruitmentStore();

const visible = defineModel<boolean>('visible', {
  type: Boolean,
  default: false,
  required: true,
});

const selectedRid = ref<string>('');

const formData = ref<{
  name?: string;
  beginning?: string;
  deadline?: string;
  end?: string;
}>({
  name: '',
  beginning: '',
  deadline: '',
  end: '',
});

const emit = defineEmits<{
  (e: 'recruitmentUpdated'): void;
}>();

const timeRange1 = ref<string[]>([]);
const deadline = ref<string>('');

// 当选择招新时，填充表单数据
const onRecruitmentChange = (rid: string) => {
  const recruitment = recruitmentStore.data.find((rec) => rec.uid === rid);
  if (recruitment) {
    formData.value = {
      name: recruitment.name || '',
      beginning: recruitment.beginning || '',
      deadline: recruitment.deadline || '',
      end: recruitment.end || '',
    };

    // 填充时间选择器（转换为本地时间）
    if (recruitment.beginning && recruitment.end) {
      timeRange1.value = [
        new Date(recruitment.beginning).toLocaleString().replace(' ', ' '),
        new Date(recruitment.end).toLocaleString().replace(' ', ' '),
      ];
    } else {
      timeRange1.value = [];
    }

    // 填充报名结束时间（转换为本地时间）
    if (recruitment.deadline) {
      deadline.value = new Date(recruitment.deadline)
        .toLocaleString()
        .replace(' ', ' ');
    } else {
      deadline.value = '';
    }

    console.log('timeRange1.value:', timeRange1.value);
    console.log('deadline.value:', deadline.value);
  }
};

// 当 modal 打开时，清空表单
watch(
  () => visible.value,
  (newValue) => {
    if (!newValue) {
      // modal 关闭时，清空表单
      selectedRid.value = '';
      formData.value = {
        name: '',
        beginning: '',
        deadline: '',
        end: '',
      };
      timeRange1.value = [];
      deadline.value = '';
    }
  },
);

const formatName = (name: string) => {
  let normalizedName = name.trim();
  if (normalizedName.includes('春')) {
    normalizedName = normalizedName.replace(/春.*/, 'S');
  } else if (normalizedName.includes('夏')) {
    normalizedName = normalizedName.replace(/夏.*/, 'C');
  } else if (normalizedName.includes('秋')) {
    normalizedName = normalizedName.replace(/秋.*/, 'A');
  }
  return normalizedName;
};

const formValidate = () => {
  const errors: { [key: string]: string } = {};
  const originalName = formData.value.name;

  // 名称验证（如果提供了名称）
  if (originalName) {
    const formattedName = formatName(originalName);
    const nameRegex = /^\d{4}[SAC]$/;
    if (!nameRegex.test(formattedName)) {
      errors.name = t('common.createRec.nameFormat');
    } else {
      formData.value.name = formattedName;
    }
  }

  // 时间范围验证
  if (formData.value.beginning && formData.value.end) {
    const beginningTime = new Date(formData.value.beginning).getTime();
    const endTime = new Date(formData.value.end).getTime();

    if (beginningTime >= endTime) {
      errors.rec_time_range = '招新开始时间必须早于结束时间';
    }
  }

  if (formData.value.deadline && formData.value.end) {
    const endTime = new Date(formData.value.end).getTime();
    const deadlineTime = new Date(formData.value.deadline).getTime();

    if (deadlineTime >= endTime) {
      errors.signup_time_range = t(
        'common.createRec.signupEndTimeBeforeRecEndTime',
      );
    }
  }

  if (Object.keys(errors).length > 0) {
    Message.error(Object.values(errors).join('; '));
    return false;
  }

  return true;
};

const sendForm = async () => {
  try {
    // 检查是否选择了招新
    if (!selectedRid.value) {
      Message.error('请先选择要修改的招新');
      return false;
    }

    const isValid = formValidate();
    if (!isValid) {
      return false;
    }

    // 只发送有值的字段
    const updateData: UpdateParams = {};
    if (formData.value.name) {
      updateData.name = formData.value.name;
    }
    if (formData.value.beginning) {
      updateData.beginning = formData.value.beginning;
    }
    if (formData.value.deadline) {
      updateData.deadline = formData.value.deadline;
    }
    if (formData.value.end) {
      updateData.end = formData.value.end;
    }

    // 如果没有任何更新，提示用户
    if (Object.keys(updateData).length === 0) {
      Message.warning('没有任何修改');
      return false;
    }

    await recruitmentStore.updateRecruitment(selectedRid.value, updateData);
    Message.success('招新更新成功');
    emit('recruitmentUpdated');
    return true;
  } catch (error) {
    Message.error((error as any).message || '更新失败');
    return false;
  }
};

const onOk1 = (dateString: string[], _date: any) => {
  formData.value.beginning = new Date(dateString[0]).toISOString();
  formData.value.end = new Date(dateString[1]).toISOString();
};

const onDeadlineChange = (dateString: string, _date: any) => {
  formData.value.deadline = new Date(dateString).toISOString();
};
</script>
