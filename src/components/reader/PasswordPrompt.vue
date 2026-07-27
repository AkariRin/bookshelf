<!--
  加密归档的口令输入。

  口令只存在本组件的局部 state：不进 pinia、不持久化、不入 URL。
-->
<template>
  <v-card class="mx-auto" max-width="420" variant="outlined">
    <v-card-item>
      <div class="d-flex align-center ga-2">
        <v-icon color="secondary">mdi-lock-outline</v-icon>
        <span class="text-subtitle-1 font-weight-medium">此日志已加密</span>
      </div>
    </v-card-item>
    <v-card-text>
      <p class="text-body-2 text-medium-emphasis mb-4">输入口令以阅读内容。</p>
      <v-form @submit.prevent="submit">
        <v-text-field
          v-model="password"
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          :error-messages="errorMessage"
          :hint="`至少 ${MIN_PASSWORD_LENGTH} 个字符`"
          autofocus
          label="口令"
          variant="outlined"
          @click:append-inner="visible = !visible"
        />
        <v-btn
          :disabled="!canSubmit"
          :loading="busy"
          block
          color="primary"
          type="submit"
          class="mt-2"
        >
          解锁
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MIN_PASSWORD_LENGTH } from '@aemeath-projects/trpg/story'

const props = defineProps<{ errorMessage: string; busy: boolean }>()
const emit = defineEmits<{ submit: [password: string] }>()

const password = ref('')
const visible = ref(false)

// 按解析器导出的下限做前端预校验，避免为必定失败的口令跑 600k 次 PBKDF2 迭代
const canSubmit = computed(
  () => !props.busy && password.value.length >= MIN_PASSWORD_LENGTH,
)

function submit() {
  if (!canSubmit.value) return
  emit('submit', password.value)
}
</script>
