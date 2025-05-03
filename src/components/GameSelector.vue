<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore, SUPPORTED_GAMES } from '../stores/gameData'

const gameStore = useGameStore()

// 游戏选择对话框
const isSelectDialogOpen = ref(false)

// 切换游戏
function switchGame(gameId: string) {
  gameStore.setCurrentGame(gameId)
  isSelectDialogOpen.value = false
}

// 当前游戏名称和图标
const currentGameInfo = computed(() => {
  const game = SUPPORTED_GAMES.find(g => g.id === gameStore.currentGameId)
  return {
    name: game?.name || '未知游戏',
    icon: game?.icon || '❓'
  }
})
</script>

<template>
  <div class="game-selector">
    <a-dropdown>
      <a-button type="primary">
        <template #icon>
          <span class="game-icon">{{ currentGameInfo.icon }}</span>
        </template>
        {{ currentGameInfo.name }}
        <down-outlined />
      </a-button>
      <template #overlay>
        <a-menu>
          <a-menu-item
            v-for="game in SUPPORTED_GAMES"
            :key="game.id"
            @click="switchGame(game.id)"
          >
            <span class="game-icon">{{ game.icon }}</span> {{ game.name }}
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<style scoped>
.game-selector {
  margin-right: 16px;
}

.game-icon {
  font-size: 16px;
  margin-right: 8px;
}
</style>