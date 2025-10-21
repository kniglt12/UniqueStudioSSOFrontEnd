<template>
  <a-scrollbar
    v-if="!showDateManagement"
    class="w-full h-full sm:pr-4 overflow-y-auto overflow-x-hidden"
    outer-class="w-full h-full"
  >
    <div class="bg-[--color-bg-2] w-full p-5">
      <div class="text-[--color-text-1] text-xl pb-5 hidden sm:flex">{{
        $t('menu.interview.management')
      }}</div>

      <div class="flex flex-col flex-1 w-full h-full">
        <div class="flex justify-between pb-5">
          <a-select
            v-model="displayType"
            class="sm:hidden flex"
            :bordered="false"
          >
            <a-option
              v-for="item in displayTypeItems"
              :key="item"
              :value="item"
            >
              {{ $t(item) }}
            </a-option>
          </a-select>
          <!-- 移动端 选择显示类型 信息or操作 -->

          <a-select
            v-model="interviewType"
            class="sm:hidden flex"
            :bordered="false"
          >
            <a-option v-for="item in tabItems" :key="item" :value="item">
              {{ $t(item) }}
            </a-option>
          </a-select>
          <!-- 移动端 选择面试类别 -->

          <a-radio-group v-model="interviewType" class="hidden sm:flex">
            <a-radio v-for="item in tabItems" :key="item" :value="item">
              <template #radio="{ checked }">
                <a-tag
                  :checked="checked"
                  checkable
                  size="large"
                  :class="
                    checked
                      ? 'px-5 rounded-full text-[rgb(var(--primary-6))]'
                      : 'px-5 rounded-full'
                  "
                  >{{ $t(item) }}</a-tag
                >
              </template>
            </a-radio>
          </a-radio-group>
          <!-- PC端 选择面试类别 -->

          <team-group-radio v-model="currentGroup"></team-group-radio>
          <!-- 选择组 -->
        </div>

        <div class="flex justify-between pb-5">
          <a-input-search
            v-model="searchValue"
            class="sm:w-80 w-1/2 mr-5"
            :placeholder="$t('common.operation.searchByName')"
          />
          <!-- 搜索框 -->
        </div>
        <div class="flex justify-between pb-5 pt-5 sm:mt-auto">
          <a-button
            type="outline"
            class="sm:w-auto"
            @click="showDateManagement = true"
          >
            {{ $t('common.operation.dateManagement') }}
          </a-button>
          <!-- 日程管理 -->
          <a-button
            type="outline"
            class="sm:w-auto"
            :disabled="!selectData.length"
            @click="showNotify = true"
          >
            <template #icon> <icon-plus /> </template>
            {{ $t('common.operation.sendNotification') }}
          </a-button>
          <!-- 发送通知 -->
        </div>

        <a-table
          v-model:selected-keys="selectedKeys"
          row-key="aid"
          :data="data"
          :row-selection="{
            type: 'checkbox',
            showCheckedAll: true,
            onlyCurrent: false,
          }"
          :pagination="false"
          column-resizable
        >
          <template #columns>
            <a-table-column
              key="common.user.name"
              :title="$t('common.user.name')"
              data-index="name"
              :width="widthType === 'sm' ? 75 : undefined"
            >
              <template #cell="{ record }">
                <a-link
                  @click="
                    $router.push(`/overview/candidate-detail/${record.aid}`)
                  "
                  ><a-typography-text>{{
                    record.name
                  }}</a-typography-text></a-link
                >
              </template>
            </a-table-column>
            <!-- 姓名 -->

            <a-table-column
              v-if="widthType != 'sm' || displayType === 'common.information'"
              key="common.user.interviewTime"
              :title="$t('common.user.interviewTime')"
              data-index="interviewTime"
              :sortable="{
                sortDirections: ['ascend', 'descend'],
              }"
            ></a-table-column>
            <!-- 面试时间 -->

            <a-table-column
              v-if="
                widthType != 'sm' || displayType === 'common.operation.operate'
              "
              :title="$t('common.operation.operate')"
            >
              <template #cell="{ record }">
                <!-- record are the data of the row -->
                <a-button
                  class="px-2"
                  type="text"
                  @click="
                    showAllowcate = true;
                    allowcateApplicationId = record.aid;
                  "
                  >{{ $t('common.operation.allocate') }}</a-button
                >
                <a-button
                  class="px-2"
                  type="text"
                  @click="
                    selectedKeys = [record.aid];
                    showNotify = true;
                  "
                  >{{ $t('common.operation.notify') }}</a-button
                >
              </template>
            </a-table-column>
            <!-- 操作column -->
          </template>
        </a-table>
      </div>
    </div>
  </a-scrollbar>

  <date-management-modal
    v-if="showDateManagement"
    v-model:show="showDateManagement"
  />

  <notification-modal
    v-model:show-notify="showNotify"
    :candidates="selectData"
    :cur-step="interviewType === InterviewType.Group ? 2 : 5"
    :rec-name="recStore.currentRec?.name ?? ''"
    :type="'Accept'"
    :group="currentGroup"
  />
  <!-- 发送通知弹窗 -->

  <allowcate-modal
    v-model:show-allowcate="showAllowcate"
    :application-id="allowcateApplicationId"
    :interview-type="interviewType === InterviewType.Team ? 'team' : 'group'"
    :current-group="currentGroup"
    :filtered-apps="filteredAndSortedApps"
    :merged-time-ranges="mergedTimeRanges"
  />
  <!-- 分配选手面试时间弹窗 -->
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import { Group, InterviewType, Step } from '@/constants/team';
import TeamGroupRadio from '@/views/components/team-group-radio.vue';
import NotificationModal from '@/views/components/notification-modal.vue';
import useRecruitmentStore from '@/store/modules/recruitment';
import useWindowResize from '@/hooks/resize';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import { sortAndMergeTimeRanges, timeRangesType } from '@/utils/isOverlapping';
import AllowcateModal from './allowcate-modal.vue';
import DateManagementModal from './date-management-modal.vue';

const recStore = useRecruitmentStore();
const { t } = useI18n();
const { widthType } = useWindowResize();

const interviewType = ref(InterviewType.Group);
const currentGroup = ref(Group.Web);
const selectedKeys = ref<string[]>([]);
watch([interviewType, currentGroup], () => {
  selectedKeys.value.length = 0;
});
const searchValue = ref('');
const allowcateApplicationId = ref<string>('');
const displayType = ref('common.information');

const showAllowcate = ref(false);
const showNotify = ref(false);
const showDateManagement = ref(false);

const tabItems = [InterviewType.Group, InterviewType.Team];
const displayTypeItems = ['common.information', 'common.operation.operate'];

const filteredAndSortedApps = computed(() =>
  recStore.curApplications
    .filter((app) => {
      // 根据选手阶段、组别、面试类型筛选选手
      if (app.abandoned || app.rejected) return false;
      if (app.group !== currentGroup.value) return false;
      if (interviewType.value === InterviewType.Group) {
        if (
          app.step !== Step.GroupInterview &&
          app.step !== Step.GroupTimeSelection
        )
          return false;
      } else if (interviewType.value === InterviewType.Team) {
        if (
          app.step !== Step.TeamInterview &&
          app.step !== Step.TeamTimeSelection
        )
          return false;
      }
      return app.user_detail?.name.includes(searchValue.value);
    })
    .sort((app1, app2) => {
      const alloGroup1 = app1.interview_allocations_group;
      const alloTeam1 = app1.interview_allocations_team;
      const interviewData1 =
        interviewType.value === InterviewType.Group ? alloGroup1 : alloTeam1;

      const alloGroup2 = app2.interview_allocations_group;
      const alloTeam2 = app2.interview_allocations_team;
      const interviewData2 =
        interviewType.value === InterviewType.Group ? alloGroup2 : alloTeam2;

      const isSet1 =
        interviewData1 && interviewData1.uid && interviewData1.start;
      const isSet2 =
        interviewData2 && interviewData2.uid && interviewData2.start;

      // 未指定的放前面
      if (!isSet1 && !isSet2) return 0;
      if (isSet1 && !isSet2) return 1;
      if (!isSet1 && isSet2) return -1;

      return (
        new Date(interviewData1!.start).getTime() -
        new Date(interviewData2!.start).getTime()
      );
    }),
);

const mergedTimeRanges = computed(() => {
  const raw: timeRangesType[] = [];
  filteredAndSortedApps.value.forEach((app) => {
    const interview =
      interviewType.value === InterviewType.Group
        ? app.interview_allocations_group
        : app.interview_allocations_team;
    if (interview && interview.uid && interview.start && interview.end) {
      raw.push([new Date(interview.start), new Date(interview.end)]);
    }
  });
  const merged = sortAndMergeTimeRanges(raw);
  return merged;
});

const data = computed(() =>
  filteredAndSortedApps.value.map((app, ind) => {
    const alloGroup = app.interview_allocations_group;
    const alloTeam = app.interview_allocations_team;
    const interviewData =
      interviewType.value === InterviewType.Group ? alloGroup : alloTeam;

    const ret = {
      key: ind.toString(),
      name: app.user_detail?.name ?? '',
      interviewTime:
        interviewData && interviewData.uid
          ? `${dayjs(interviewData.start).format('YYYY-MM-DD')} ${dayjs(
              interviewData.start,
            ).format('HH:mm')}-${dayjs(interviewData.end).format('HH:mm')}`
          : t('common.status.waitForDistribution'),
      groupInterviewTime: alloGroup?.uid ? alloGroup.start : '',
      teamInterviewTime: alloTeam?.uid ? alloTeam.start : '',
      aid: app.uid,
      step: app.step,
    };
    if (
      ret.interviewTime === t('common.status.waitForDistribution') &&
      app.interview_selections &&
      app.interview_selections.length !== 0
    ) {
      ret.name = `💡${ret.name}`;
    }

    return ret;
  }),
);

// 发送通知
const selectData = computed(() =>
  data.value
    .filter(({ aid }) => selectedKeys.value.includes(aid))
    .map(({ name, aid, step, groupInterviewTime, teamInterviewTime }) => ({
      name,
      aid,
      step,
      groupInterviewTime,
      teamInterviewTime,
    })),
);
</script>

<style scoped lang="less"></style>
